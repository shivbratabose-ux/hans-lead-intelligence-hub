import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, Clipboard, Sparkles, AlertTriangle, CheckCircle, XCircle,
  Loader2, Download, Plus, Merge, ChevronDown, ChevronUp, Mail, Phone, Info, ArrowRight, Trash2, RefreshCw
} from 'lucide-react';
import { INDUSTRY_SUMMARY, INDUSTRY_COLORS, INDUSTRY_ICONS } from '../data/realContacts';
import { supabase } from '../lib/supabase';
import './SmartImport.css';

const APP_FIELDS = ['name','company','title','email','phone','location','industry','product','source','status','country','linkedin'];

const FIELD_LABELS = {
  name: 'Contact Name', company: 'Company', title: 'Job Title', email: 'Email',
  phone: 'Phone', location: 'Location', industry: 'Industry', product: 'Product Interest',
  source: 'Source', status: 'Status', country: 'Country', linkedin: 'LinkedIn',
};

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 4096 } })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  
  const parseLine = (line) => {
    const result = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"' && (i === 0 || line[i-1] === delimiter)) { inQuotes = true; continue; }
      if (line[i] === '"' && inQuotes && (i === line.length-1 || line[i+1] === delimiter)) { inQuotes = false; continue; }
      if (line[i] === delimiter && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += line[i];
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(l => {
    const vals = parseLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  
  return { headers, rows };
}

export default function SmartImport() {
  const geminiKey = localStorage.getItem('gemini_api_key') || '';
  
  // Steps: paste → map → review → done
  const [step, setStep] = useState('paste'); // paste, mapping, review, done
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState({ headers: [], rows: [] });
  const [fieldMapping, setFieldMapping] = useState({});
  const [aiMapping, setAiMapping] = useState(null);
  const [importing, setImporting] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [importSource, setImportSource] = useState('Manual Import');
  const [importIndustry, setImportIndustry] = useState('');
  
  // Review state
  const [reviewData, setReviewData] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [mergeSelections, setMergeSelections] = useState({});
  const [importResult, setImportResult] = useState(null);

  // Build email/phone index from existing contacts in Supabase
  const [existingIndex, setExistingIndex] = useState({ emailIdx: {}, phoneIdx: {} });
  const [indexLoading, setIndexLoading] = useState(false);

  // Load dedup index from Supabase when step changes to 'mapping' (before review)
  useEffect(() => {
    if (step === 'mapping' && Object.keys(existingIndex.emailIdx).length === 0) {
      loadExistingIndex();
    }
  }, [step]);

  const loadExistingIndex = async () => {
    setIndexLoading(true);
    const emailIdx = {}, phoneIdx = {};
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data } = await supabase
        .from('contacts')
        .select('name, company, email, phone, title, industry, product, source, status, country, linkedin, location')
        .range(from, from + batchSize - 1);

      if (data && data.length > 0) {
        data.forEach(c => {
          const email = (c.email || '').toLowerCase().trim();
          const phone = (c.phone || '').replace(/[\s\-\(\)]/g, '');
          if (email && email.includes('@')) emailIdx[email] = c;
          if (phone && phone.length > 6) phoneIdx[phone] = c;
        });
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    setExistingIndex({ emailIdx, phoneIdx });
    setIndexLoading(false);
  };

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        setRawText(text);
        const parsed = parseCSV(text);
        setParsedData(parsed);
        setImportSource(file.name.replace(/\.\w+$/, ''));
        if (parsed.headers.length > 0) autoMap(parsed.headers);
      };
      reader.readAsText(file, 'utf-8');
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // For Excel files, we'd need a library — show message
      alert('Excel files detected. Please save as CSV first, or paste the data directly.\n\nTip: Open in Excel → Select All → Copy → Paste here');
    }
  }, []);

  // Handle paste
  const handlePaste = useCallback(() => {
    if (!rawText.trim()) return;
    const parsed = parseCSV(rawText);
    setParsedData(parsed);
    if (parsed.headers.length > 0) autoMap(parsed.headers);
  }, [rawText]);

  // Auto-map using simple heuristics
  const autoMap = (headers) => {
    const mapping = {};
    const patterns = {
      name: /^(name|contact|person|full.?name|delegate|attendee|first.?name)/i,
      company: /^(company|org|business|firm|enterprise|employer)/i,
      title: /^(title|designation|job|position|role|desig)/i,
      email: /^(email|e.?mail|mail|address)/i,
      phone: /^(phone|mobile|cell|tel|contact.?no|number)/i,
      location: /^(location|city|address|place|state|region)/i,
      industry: /^(industry|sector|segment|category|type|vertical)/i,
      product: /^(product|service|interest|solution)/i,
      source: /^(source|lead.?source|origin|channel|campaign)/i,
      status: /^(status|stage|lead.?status|state)/i,
      country: /^(country|nation|geo)/i,
      linkedin: /^(linkedin|profile|url|link)/i,
    };
    
    headers.forEach(h => {
      const clean = h.trim();
      for (const [field, regex] of Object.entries(patterns)) {
        if (regex.test(clean) && !Object.values(mapping).includes(field)) {
          mapping[clean] = field;
          break;
        }
      }
      if (!mapping[clean]) mapping[clean] = ''; // unmapped
    });
    
    setFieldMapping(mapping);
    setStep('mapping');
  };

  // AI-powered smart mapping
  const aiSmartMap = async () => {
    if (!geminiKey) { alert('Please set your Gemini API key in AI Enrichment page first'); return; }
    
    setMappingLoading(true);
    const sampleRows = parsedData.rows.slice(0, 3).map(r =>
      parsedData.headers.map(h => `${h}: "${r[h] || ''}"`).join(', ')
    ).join('\n');
    
    const prompt = `You are a data mapping assistant. Given these CSV headers and sample data, map each header to the most appropriate field in the target schema.

Target fields: ${APP_FIELDS.join(', ')}

Source headers: ${parsedData.headers.join(', ')}

Sample rows:
${sampleRows}

Rules:
1. Map each source header to exactly one target field (or "skip" if irrelevant)
2. If a header like "Sr No" or "Column1" has no useful mapping, set it to "skip"
3. If "First Name" and "Last Name" exist, map both to "name" (will be combined)
4. If no industry column exists, try to infer from company type or categories
5. Respond in STRICT JSON: {"headerName": "targetField", ...}
JSON only.`;

    try {
      const response = await callGemini(geminiKey, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiMap = JSON.parse(jsonMatch[0]);
        const newMapping = { ...fieldMapping };
        Object.entries(aiMap).forEach(([header, target]) => {
          if (parsedData.headers.includes(header) && (APP_FIELDS.includes(target) || target === 'skip')) {
            newMapping[header] = target === 'skip' ? '' : target;
          }
        });
        setFieldMapping(newMapping);
        setAiMapping(aiMap);
      }
    } catch (err) {
      alert('AI mapping failed: ' + err.message);
    }
    setMappingLoading(false);
  };

  // Process and detect duplicates
  const processImport = () => {
    const mapped = parsedData.rows.map(row => {
      const contact = {};
      parsedData.headers.forEach(h => {
        const target = fieldMapping[h];
        if (target && target !== 'skip') {
          if (contact[target]) {
            // Combine (e.g., first name + last name)
            contact[target] = (contact[target] + ' ' + (row[h] || '')).trim();
          } else {
            contact[target] = (row[h] || '').trim();
          }
        }
      });
      // Set defaults
      contact.source = contact.source || importSource;
      contact.industry = contact.industry || importIndustry || 'Logistics & Freight';
      contact.contactType = 'New Lead';
      contact.region = '';
      contact.country = contact.country || '';
      contact.score = '';
      contact.linkedin = contact.linkedin || '';
      return contact;
    }).filter(c => c.name || c.company || c.email); // Remove empty rows

    // Detect duplicates
    const dupes = [], clean = [];
    mapped.forEach((c, i) => {
      const email = (c.email || '').toLowerCase().trim();
      const phone = (c.phone || '').replace(/[\s\-\(\)]/g, '');
      
      let existingMatch = null;
      let matchType = '';
      
      if (email && email.includes('@') && existingIndex.emailIdx[email]) {
        existingMatch = existingIndex.emailIdx[email];
        matchType = 'email';
      } else if (phone && phone.length > 6 && existingIndex.phoneIdx[phone]) {
        existingMatch = existingIndex.phoneIdx[phone];
        matchType = 'phone';
      }
      
      if (existingMatch) {
        dupes.push({ index: i, new: c, existing: existingMatch, matchType, additionalFields: getAdditionalFields(c, existingMatch) });
      } else {
        clean.push(c);
      }
    });

    setReviewData(clean);
    setDuplicates(dupes);
    setMergeSelections({});
    setStep('review');
  };

  // Find fields where new data has info that existing doesn't
  const getAdditionalFields = (newC, existC) => {
    const additional = [];
    APP_FIELDS.forEach(f => {
      const newVal = (newC[f] || '').trim();
      const existVal = (existC[f] || '').trim();
      if (newVal && (!existVal || existVal.length < newVal.length) && f !== 'email' && f !== 'phone') {
        additional.push({ field: f, newValue: newVal, existingValue: existVal });
      }
    });
    return additional;
  };

  // Toggle merge for a duplicate
  const toggleMerge = (index, field) => {
    setMergeSelections(prev => {
      const key = `${index}_${field}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // Confirm import
  const confirmImport = () => {
    // Count merged fields
    let mergedCount = 0;
    duplicates.forEach((d, i) => {
      d.additionalFields.forEach(af => {
        if (mergeSelections[`${i}_${af.field}`]) mergedCount++;
      });
    });

    setImportResult({
      newContacts: reviewData.length,
      duplicatesFound: duplicates.length,
      fieldsMerged: mergedCount,
      source: importSource,
    });
    setStep('done');
  };

  return (
    <div className="import-page animate-in">
      {/* Header title shown in topbar; Step Indicator below */}
      {/* Step Indicator */}
      <div className="import-steps">
        {[
          { id: 'paste', label: 'Paste / Upload', icon: Clipboard },
          { id: 'mapping', label: 'AI Field Mapping', icon: Sparkles },
          { id: 'review', label: 'Review & Dedupe', icon: AlertTriangle },
          { id: 'done', label: 'Import Complete', icon: CheckCircle },
        ].map((s, i) => (
          <div key={s.id} className={`step-item ${step === s.id ? 'active' : ''} ${['paste','mapping','review','done'].indexOf(step) > i ? 'completed' : ''}`}>
            <div className="step-circle"><s.icon size={14} /></div>
            <span className="step-label">{s.label}</span>
            {i < 3 && <ArrowRight size={12} className="step-arrow" />}
          </div>
        ))}
      </div>

      {/* Step 1: Paste / Upload */}
      {step === 'paste' && (
        <div className="import-step-content">
          <div className="paste-grid">
            <div className="paste-area">
              <h3><Clipboard size={16} /> Paste Data</h3>
              <p className="paste-hint">Paste CSV, tab-separated, or any structured data. AI will figure out the columns.</p>
              <textarea
                className="paste-textarea"
                rows={14}
                placeholder={`Paste your data here... Examples supported:\n\nCSV format:\nName,Company,Email,Phone\nJohn Doe,Acme Corp,john@acme.com,+91 98765\n\nTab-separated:\nName\tEmail\tCompany\nJane Smith\tjane@xyz.com\tXYZ Logistics\n\nAny format — AI will auto-detect columns`}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
              <div className="paste-actions">
                <button className="btn btn-primary" onClick={handlePaste} disabled={!rawText.trim()}>
                  <Sparkles size={14} /> Analyze & Map
                </button>
                <span className="paste-stats">
                  {rawText.trim() ? `${rawText.split('\n').filter(l => l.trim()).length} lines detected` : ''}
                </span>
              </div>
            </div>
            <div className="upload-area">
              <h3><FileSpreadsheet size={16} /> Upload File</h3>
              <div className="upload-dropzone">
                <Upload size={32} className="upload-icon" />
                <p>Drag & drop or click to upload</p>
                <span className="upload-formats">CSV, TSV, TXT</span>
                <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="file-input" />
              </div>
              <div className="import-options">
                <div className="option-group">
                  <label>Default Source Tag</label>
                  <input value={importSource} onChange={e => setImportSource(e.target.value)} placeholder="e.g., CPH Event 2026" />
                </div>
                <div className="option-group">
                  <label>Default Industry</label>
                  <select value={importIndustry} onChange={e => setImportIndustry(e.target.value)}>
                    <option value="">Auto-detect</option>
                    {INDUSTRY_SUMMARY.map(s => <option key={s.industry} value={s.industry}>{s.industry}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Field Mapping */}
      {step === 'mapping' && (
        <div className="import-step-content">
          <div className="mapping-header">
            <div>
              <h3><Sparkles size={16} /> Field Mapping</h3>
              <p className="mapping-subtitle">
                {parsedData.headers.length} columns detected · {parsedData.rows.length} rows
                {aiMapping && <span className="ai-mapped-badge"><Sparkles size={10} /> AI Mapped</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setStep('paste'); setParsedData({ headers: [], rows: [] }); }}>
                ← Back
              </button>
              <button className="btn btn-primary btn-sm" onClick={aiSmartMap} disabled={mappingLoading || !geminiKey}>
                {mappingLoading ? <><Loader2 size={12} className="spin" /> AI Mapping...</> : <><Sparkles size={12} /> AI Smart Map</>}
              </button>
            </div>
          </div>

          <div className="mapping-grid">
            {parsedData.headers.map(h => (
              <div key={h} className={`mapping-row ${fieldMapping[h] ? 'mapped' : 'unmapped'}`}>
                <div className="mapping-source">
                  <span className="source-header">{h}</span>
                  <span className="source-sample">{parsedData.rows[0]?.[h]?.slice(0, 30) || '—'}</span>
                </div>
                <ArrowRight size={14} className="mapping-arrow" />
                <select
                  value={fieldMapping[h] || ''}
                  onChange={e => setFieldMapping(prev => ({ ...prev, [h]: e.target.value }))}
                  className={fieldMapping[h] ? 'mapped-select' : ''}
                >
                  <option value="">⊘ Skip</option>
                  {APP_FIELDS.map(f => (
                    <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mapping-preview">
            <h4>Preview (first 5 rows after mapping)</h4>
            <div className="preview-scroll">
              <table className="preview-table">
                <thead>
                  <tr>{APP_FIELDS.filter(f => Object.values(fieldMapping).includes(f)).map(f => <th key={f}>{FIELD_LABELS[f]}</th>)}</tr>
                </thead>
                <tbody>
                  {parsedData.rows.slice(0, 5).map((row, i) => {
                    const mapped = {};
                    parsedData.headers.forEach(h => {
                      const target = fieldMapping[h];
                      if (target) mapped[target] = (mapped[target] ? mapped[target] + ' ' : '') + (row[h] || '');
                    });
                    return (
                      <tr key={i}>
                        {APP_FIELDS.filter(f => Object.values(fieldMapping).includes(f)).map(f => (
                          <td key={f}>{(mapped[f] || '').trim().slice(0, 40) || '—'}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={processImport} disabled={!Object.values(fieldMapping).some(v => v)}>
              <CheckCircle size={14} /> Process & Detect Duplicates
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Dedupe */}
      {step === 'review' && (
        <div className="import-step-content">
          <div className="review-header">
            <div>
              <h3>Review & Deduplicate</h3>
              <p className="mapping-subtitle">{reviewData.length + duplicates.length} total rows processed</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('mapping')}>← Back to Mapping</button>
              <button className="btn btn-primary" onClick={confirmImport}>
                <Plus size={14} /> Import {reviewData.length} New Contacts
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="review-summary">
            <div className="review-card green">
              <CheckCircle size={20} />
              <div className="review-card-number">{reviewData.length}</div>
              <div className="review-card-label">New (Ready to Import)</div>
            </div>
            <div className="review-card amber">
              <AlertTriangle size={20} />
              <div className="review-card-number">{duplicates.length}</div>
              <div className="review-card-label">Duplicates Found</div>
            </div>
            <div className="review-card blue">
              <Merge size={20} />
              <div className="review-card-number">{Object.values(mergeSelections).filter(Boolean).length}</div>
              <div className="review-card-label">Fields to Merge</div>
            </div>
          </div>

          {/* Duplicates Section */}
          {duplicates.length > 0 && (
            <div className="dupes-section">
              <h4 className="dupes-title">
                <AlertTriangle size={14} color="#F59E0B" /> Duplicates Detected ({duplicates.length})
                <span className="dupes-hint">Matched by email or phone. Select additional data to merge.</span>
              </h4>
              <div className="dupes-list">
                {duplicates.map((d, i) => (
                  <DuplicateCard
                    key={i}
                    dupe={d}
                    index={i}
                    mergeSelections={mergeSelections}
                    toggleMerge={toggleMerge}
                  />
                ))}
              </div>
            </div>
          )}

          {/* New Contacts Preview */}
          {reviewData.length > 0 && (
            <div className="new-contacts-section">
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                <CheckCircle size={14} color="#10B981" /> New Contacts ({reviewData.length})
              </h4>
              <div className="preview-scroll">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Company</th><th>Email</th><th>Phone</th>
                      <th>Industry</th><th>Location</th><th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewData.slice(0, 20).map((c, i) => (
                      <tr key={i}>
                        <td>{c.name || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{c.company || '—'}</td>
                        <td style={{ color: '#10B981', fontSize: 11 }}>{c.email || <span className="missing-data">—</span>}</td>
                        <td style={{ fontSize: 11 }}>{c.phone || '—'}</td>
                        <td><span className="ind-tag" style={{ background: `${INDUSTRY_COLORS[c.industry] || '#94A3B8'}15`, color: INDUSTRY_COLORS[c.industry] || '#94A3B8' }}>{INDUSTRY_ICONS[c.industry] || '📁'} {(c.industry||'').slice(0,15)}</span></td>
                        <td style={{ fontSize: 11, color: '#64748B' }}>{c.location || '—'}</td>
                        <td style={{ fontSize: 10, color: '#94A3B8' }}>{c.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reviewData.length > 20 && (
                  <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: 8 }}>
                    + {reviewData.length - 20} more contacts...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && importResult && (
        <div className="import-step-content">
          <div className="import-done">
            <div className="done-icon"><CheckCircle size={48} /></div>
            <h3>Import Complete!</h3>
            <div className="done-stats">
              <div className="done-stat">
                <span className="done-num" style={{ color: '#10B981' }}>{importResult.newContacts}</span>
                <span className="done-label">New Contacts Added</span>
              </div>
              <div className="done-stat">
                <span className="done-num" style={{ color: '#F59E0B' }}>{importResult.duplicatesFound}</span>
                <span className="done-label">Duplicates Detected</span>
              </div>
              <div className="done-stat">
                <span className="done-num" style={{ color: '#3B82F6' }}>{importResult.fieldsMerged}</span>
                <span className="done-label">Fields Merged</span>
              </div>
            </div>
            <p className="done-source">Source: <strong>{importResult.source}</strong></p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { setStep('paste'); setRawText(''); setParsedData({ headers: [], rows: [] }); setReviewData([]); setDuplicates([]); setImportResult(null); }}>
                <Plus size={14} /> Import More
              </button>
              <button className="btn btn-ghost" onClick={() => window.location.href = '/contacts'}>
                View Contact Explorer →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Duplicate Card Component ==========
function DuplicateCard({ dupe, index, mergeSelections, toggleMerge }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="dupe-card">
      <div className="dupe-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="dupe-match-info">
          <span className={`dupe-match-type ${dupe.matchType}`}>
            {dupe.matchType === 'email' ? <Mail size={10} /> : <Phone size={10} />}
            {dupe.matchType} match
          </span>
          <span className="dupe-name">{dupe.new.name || dupe.new.company || 'Unknown'}</span>
          <span className="dupe-company">{dupe.new.company}</span>
          <span className="dupe-match-value">
            {dupe.matchType === 'email' ? dupe.new.email : dupe.new.phone}
          </span>
        </div>
        <div className="dupe-badge-group">
          {dupe.additionalFields.length > 0 && (
            <span className="dupe-additional-badge">
              <Plus size={9} /> {dupe.additionalFields.length} new fields available
            </span>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      
      {expanded && (
        <div className="dupe-card-body">
          <div className="dupe-comparison">
            <div className="dupe-col">
              <span className="dupe-col-label">Existing Record</span>
              <div className="dupe-fields">
                <div className="dupe-field"><span className="f-label">Name</span><span className="f-value">{dupe.existing.name || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Company</span><span className="f-value">{dupe.existing.company || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Email</span><span className="f-value has">{dupe.existing.email || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Phone</span><span className="f-value">{dupe.existing.phone || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Title</span><span className="f-value">{dupe.existing.title || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Industry</span><span className="f-value">{dupe.existing.industry || '—'}</span></div>
              </div>
            </div>
            <div className="dupe-col new-col">
              <span className="dupe-col-label">New Record (Incoming)</span>
              <div className="dupe-fields">
                <div className="dupe-field"><span className="f-label">Name</span><span className="f-value">{dupe.new.name || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Company</span><span className="f-value">{dupe.new.company || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Email</span><span className="f-value">{dupe.new.email || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Phone</span><span className="f-value">{dupe.new.phone || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Title</span><span className="f-value">{dupe.new.title || '—'}</span></div>
                <div className="dupe-field"><span className="f-label">Industry</span><span className="f-value">{dupe.new.industry || '—'}</span></div>
              </div>
            </div>
          </div>
          
          {dupe.additionalFields.length > 0 && (
            <div className="dupe-merge-section">
              <h5><Merge size={12} /> Merge Additional Data (select to approve)</h5>
              {dupe.additionalFields.map(af => (
                <label key={af.field} className={`merge-option ${mergeSelections[`${index}_${af.field}`] ? 'selected' : ''}`}>
                  <input type="checkbox" checked={!!mergeSelections[`${index}_${af.field}`]}
                    onChange={() => toggleMerge(index, af.field)} />
                  <span className="merge-field-name">{FIELD_LABELS[af.field]}</span>
                  <span className="merge-old">{af.existingValue || '(empty)'}</span>
                  <ArrowRight size={10} />
                  <span className="merge-new">{af.newValue}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
