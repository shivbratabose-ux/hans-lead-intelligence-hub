import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LEADS from '../data/leads';
import './PipelineBoard.css';

const STAGES = [
  { key: 'New', color: '#94A3B8' },
  { key: 'Contacted', color: '#3B82F6' },
  { key: 'Demo Scheduled', color: '#8B5CF6' },
  { key: 'Qualified', color: '#10B981' },
  { key: 'Opportunity', color: '#F59E0B' },
  { key: 'Won', color: '#10B981' },
  { key: 'Disqualified', color: '#EF4444' },
];

export default function PipelineBoard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(LEADS);
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragItem = useRef(null);

  const handleDragStart = (e, leadId) => {
    dragItem.current = leadId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(stage);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragItem.current) {
      setLeads(prev =>
        prev.map(l =>
          l.id === dragItem.current ? { ...l, status: stage } : l
        )
      );
      dragItem.current = null;
    }
  };

  return (
    <div className="pipeline animate-in">
      <div className="pipeline-header">
        <div>
          <h2 className="page-title">Pipeline Board</h2>
          <p className="page-subtitle">Drag and drop leads between stages</p>
        </div>
        <div className="pipeline-filters">
          <select className="select">
            <option>All Products</option>
            <option>iCAFFE</option>
            <option>WiseCCS</option>
            <option>WiseGSA</option>
            <option>WiseDOX</option>
            <option>AMS</option>
          </select>
          <select className="select">
            <option>All Owners</option>
            <option>Priya Mehta</option>
            <option>Amit Desai</option>
            <option>Kavita Singh</option>
          </select>
        </div>
      </div>

      <div className="pipeline-board">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.key);
          return (
            <div
              key={stage.key}
              className={`pipeline-column ${dragOverCol === stage.key ? 'drag-over' : ''}`}
              data-stage={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="pipeline-column-header">
                <div className="column-title-wrap">
                  <div className="column-dot" style={{ background: stage.color }} />
                  <span className="column-title">{stage.key}</span>
                </div>
                <span className="column-count">{stageLeads.length}</span>
              </div>
              <div className="pipeline-column-body">
                {stageLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <div className="kanban-card-top">
                      <span className="kanban-card-name">{lead.name}</span>
                      <span className={`badge badge-${lead.band.toLowerCase()}`} style={{ fontSize: 10 }}>{lead.band}</span>
                    </div>
                    <div className="kanban-card-company">{lead.company}</div>
                    <div className="kanban-card-meta">
                      <span className="kanban-card-product">{lead.product}</span>
                      <span className="kanban-card-score" style={{
                        color: lead.band === 'Hot' ? '#EF4444' : lead.band === 'Warm' ? '#F59E0B' : '#3B82F6'
                      }}>{lead.score}</span>
                    </div>
                    <div className="kanban-card-bottom">
                      <div className="kanban-card-owner">
                        <div className="avatar" style={{
                          background: `hsl(${(lead.assignedName || 'UA').charCodeAt(0) * 7 % 360}, 55%, 50%)`
                        }}>
                          {(lead.assignedName || 'UA').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span>{lead.assignedName}</span>
                      </div>
                      <span className="kanban-card-date">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
