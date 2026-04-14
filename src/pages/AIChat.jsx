import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import './AIChat.css';

const PRODUCTS = ['iCAFFE', 'WiseDOX', 'WiseCCS', 'WiseGSA', 'AMS'];

const CONVERSATION_FLOWS = {
  iCAFFE: [
    { bot: 'Welcome! Are you looking to automate freight forwarding, customs clearance, or accounting?', field: 'interest' },
    { bot: 'Which best describes your company? (Freight forwarder, CHA/broker, exporter/importer, or other)', field: 'companyType' },
    { bot: 'How many declarations/entries do you file per month?', field: 'volume' },
    { bot: 'And when are you looking to implement a solution? (Immediately, 1–3 months, later)', field: 'timeline' },
    { bot: 'iCAFFE handles exactly that — integrated ICEGATE filing for customs. Would you like a demo this week?', field: 'demo' },
    { bot: 'Perfect! May I have your name and email so we can schedule the demo?', field: 'contact' },
  ],
  WiseDOX: [
    { bot: 'Hi! Are you interested in digitizing shipping documents or e-Freight processing?', field: 'interest' },
    { bot: 'What types of documents do you manage? (Invoices, airwaybills, customs docs, all)', field: 'docTypes' },
    { bot: 'How many users would need access to the system?', field: 'users' },
    { bot: 'Who currently approves or signs documents in your process?', field: 'approver' },
    { bot: 'WiseDOX has workflow automation to route docs to the right approver. What\'s your timeline?', field: 'timeline' },
    { bot: 'We offer a free trial and onboarding. Would you like to schedule a walkthrough?', field: 'demo' },
  ],
  WiseCCS: [
    { bot: 'Hello — do you need a solution for airport cargo coordination and tracking?', field: 'interest' },
    { bot: 'Are you a terminal operator, airline, ground handler, or regulator?', field: 'companyType' },
    { bot: 'How many shipments flow through your facility daily?', field: 'volume' },
    { bot: 'Do you file advance manifests electronically now?', field: 'currentSystem' },
    { bot: 'WiseCCS provides live cargo tracking and manifest automation. Would you like a demo?', field: 'demo' },
    { bot: 'Great! Can I get your contact details to arrange the demo?', field: 'contact' },
  ],
  WiseGSA: [
    { bot: 'Good day! Are you managing cargo sales or airline stock (AWBs) in your business?', field: 'interest' },
    { bot: 'How many airlines do you represent?', field: 'airlines' },
    { bot: 'Do you issue AWBs manually today?', field: 'currentProcess' },
    { bot: 'WiseGSA automates AWB inventory, bookings, and invoicing. How soon do you need a solution?', field: 'timeline' },
    { bot: 'Can I arrange a personalized quote or demo?', field: 'demo' },
  ],
  AMS: [
    { bot: 'Hi there! Are you involved in importing/exporting goods through Indian customs?', field: 'interest' },
    { bot: 'AMS by Hans Infomatic handles advance manifest and shipping bill filing. How many shipments per month?', field: 'volume' },
    { bot: 'Do you require DGFT export documentation too?', field: 'dgft' },
    { bot: 'AMS integrates both seamlessly. Would you like to get started with a demo?', field: 'demo' },
    { bot: 'Excellent! Please share your name and email for the demo invite.', field: 'contact' },
  ],
};

export default function AIChat() {
  const [product, setProduct] = useState('iCAFFE');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [leadData, setLeadData] = useState({});
  const messagesEndRef = useRef(null);

  const flow = CONVERSATION_FLOWS[product];

  useEffect(() => {
    // Start conversation
    setMessages([]);
    setStep(0);
    setLeadData({ product });
    setTyping(true);
    const timer = setTimeout(() => {
      setMessages([{ role: 'bot', text: flow[0].bot, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setTyping(false);
      setStep(1);
    }, 800);
    return () => clearTimeout(timer);
  }, [product]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim() || typing) return;
    const userMsg = { role: 'user', text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);

    // Update lead data
    const currentField = flow[step - 1]?.field;
    if (currentField) {
      setLeadData(prev => ({ ...prev, [currentField]: input }));
    }

    setInput('');

    if (step < flow.length) {
      setTyping(true);
      setTimeout(() => {
        const botMsg = { role: 'bot', text: flow[step].bot, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, botMsg]);
        setTyping(false);
        setStep(prev => prev + 1);
      }, 1000 + Math.random() * 500);
    } else {
      setTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: 'Thank you! I\'ve captured all the details. Your lead has been created and scored. A sales representative will reach out shortly! 🎉',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setTyping(false);
      }, 1200);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Calculate live score
  const liveScore = Object.keys(leadData).reduce((sum, key) => {
    if (key === 'product') return sum + 5;
    if (key === 'demo' && leadData[key]?.toLowerCase().includes('yes')) return sum + 25;
    if (key === 'timeline' && (leadData[key]?.toLowerCase().includes('immediate') || leadData[key]?.toLowerCase().includes('asap'))) return sum + 10;
    return sum + 8;
  }, 20);

  return (
    <div className="ai-assistant animate-in">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Product Selector */}
        <div className="ai-products">
          {PRODUCTS.map(p => (
            <button key={p} className={`ai-product-card ${product === p ? 'active' : ''}`}
              onClick={() => setProduct(p)}>{p}</button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="ai-chat-area" style={{ flex: 1 }}>
          <div className="ai-chat-header">
            <div className="ai-chat-header-avatar">🤖</div>
            <div>
              <h4>Hans AI Assistant — {product}</h4>
              <p>Qualifying lead for {product} product</p>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role === 'bot' ? 'bot' : 'user'}`}>
                <div className="ai-msg-avatar">{msg.role === 'bot' ? '🤖' : '👤'}</div>
                <div>
                  <div className="ai-msg-content">{msg.text}</div>
                  <div className="ai-msg-time">{msg.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="ai-typing">
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              placeholder="Type your response..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="ai-send-btn" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Lead Preview Panel */}
      <div className="ai-lead-preview">
        <div className="ai-preview-header">
          <h4>Lead Preview</h4>
          <p>Building lead in real-time</p>
        </div>
        <div className="ai-preview-body">
          <div className="ai-preview-score">
            <div className="ai-preview-score-value">{Math.min(liveScore, 100)}</div>
            <div className="ai-preview-score-label">Live Score</div>
          </div>

          <div className="preview-field">
            <span className="preview-field-label">Product</span>
            <span className="preview-field-value">{product}</span>
          </div>
          <div className="preview-field">
            <span className="preview-field-label">Interest</span>
            <span className={`preview-field-value ${!leadData.interest ? 'pending' : ''}`}>
              {leadData.interest || 'Awaiting...'}
            </span>
          </div>
          <div className="preview-field">
            <span className="preview-field-label">Company Type</span>
            <span className={`preview-field-value ${!leadData.companyType ? 'pending' : ''}`}>
              {leadData.companyType || 'Awaiting...'}
            </span>
          </div>
          <div className="preview-field">
            <span className="preview-field-label">Volume</span>
            <span className={`preview-field-value ${!leadData.volume ? 'pending' : ''}`}>
              {leadData.volume || 'Awaiting...'}
            </span>
          </div>
          <div className="preview-field">
            <span className="preview-field-label">Timeline</span>
            <span className={`preview-field-value ${!leadData.timeline ? 'pending' : ''}`}>
              {leadData.timeline || 'Awaiting...'}
            </span>
          </div>
          <div className="preview-field">
            <span className="preview-field-label">Demo</span>
            <span className={`preview-field-value ${!leadData.demo ? 'pending' : ''}`}>
              {leadData.demo || 'Awaiting...'}
            </span>
          </div>
          <div className="preview-field">
            <span className="preview-field-label">Contact</span>
            <span className={`preview-field-value ${!leadData.contact ? 'pending' : ''}`}>
              {leadData.contact || 'Awaiting...'}
            </span>
          </div>
        </div>
        <div className="ai-preview-actions">
          <button className="btn btn-primary" style={{ width: '100%' }}>Create Lead</button>
        </div>
      </div>
    </div>
  );
}
