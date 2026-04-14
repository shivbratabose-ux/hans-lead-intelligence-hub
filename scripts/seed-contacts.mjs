/**
 * Seed contacts into Supabase — robust line-based parser
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://nxnkxedmzfrcpwfxwkjt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function loadContacts() {
  const filePath = join(__dirname, '..', 'src', 'data', 'realContacts.js');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find the line with ALL_CONTACTS
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ALL_CONTACTS')) {
      startLine = i;
      break;
    }
  }
  
  if (startLine === -1) {
    console.error('❌ Could not find ALL_CONTACTS');
    process.exit(1);
  }
  
  console.log(`  Found ALL_CONTACTS at line ${startLine + 1}`);
  
  // Extract each { ... } object from lines
  const contacts = [];
  let currentObj = '';
  let inObject = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '];') break; // End of array
    
    const braceStart = line.indexOf('{');
    if (braceStart !== -1) {
      inObject = true;
      currentObj = line.slice(braceStart);
      
      // Check if object ends on same line
      const braceEnd = currentObj.lastIndexOf('}');
      if (braceEnd !== -1) {
        let objStr = currentObj.slice(0, braceEnd + 1);
        try {
          const fn = new Function(`return ${objStr}`);
          contacts.push(fn());
        } catch (e) {
          // skip malformed
        }
        currentObj = '';
        inObject = false;
      }
    } else if (inObject) {
      currentObj += ' ' + line;
      const braceEnd = currentObj.lastIndexOf('}');
      if (braceEnd !== -1) {
        let objStr = currentObj.slice(0, braceEnd + 1);
        try {
          const fn = new Function(`return ${objStr}`);
          contacts.push(fn());
        } catch (e) {
          // skip malformed
        }
        currentObj = '';
        inObject = false;
      }
    }
  }
  
  return contacts;
}

async function seedContacts() {
  console.log('📥 Loading contacts from realContacts.js...');
  const contacts = loadContacts();
  console.log(`✅ Parsed ${contacts.length} contacts`);

  if (contacts.length === 0) {
    console.error('❌ No contacts parsed! Check file format.');
    process.exit(1);
  }

  // Map to database schema
  const dbContacts = contacts.map(c => ({
    industry: c.industry || null,
    name: c.name || null,
    company: c.company || null,
    title: c.title || null,
    email: c.email || null,
    phone: c.phone || null,
    location: c.location || null,
    product: c.product || null,
    source: c.source || null,
    status: c.status || null,
    score: c.score || null,
    linkedin: c.linkedin || null,
    country: c.country || null,
    region: c.region || null,
    contact_type: c.contactType || null,
  }));

  // Upload in batches of 500
  const BATCH_SIZE = 500;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < dbContacts.length; i += BATCH_SIZE) {
    const batch = dbContacts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('contacts').insert(batch);
    
    if (error) {
      console.error(`\n❌ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      errors++;
    } else {
      uploaded += batch.length;
      process.stdout.write(`\r📤 Uploaded: ${uploaded}/${dbContacts.length} (${Math.round(uploaded / dbContacts.length * 100)}%)`);
    }
  }

  console.log(`\n\n✅ Done! ${uploaded} contacts uploaded, ${errors} batch errors.`);
}

console.log('🚀 Seeding contacts into Supabase...');
await seedContacts();
console.log('🎉 Complete!');
