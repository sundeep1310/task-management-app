import React from 'react';
import './SummaryCard.css';

interface SummaryCardProps {
  icon: string;
  title: string;
  count: number;
  total?: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, title, count, total }) => {
  return (
    <div className="summary-card">
      <div className="summary-icon">{icon}</div>
      <div className="summary-info">
        <div className="summary-title">{title}</div>
        <div className="summary-count">
          {total ? (
            <span>
              {count}
              <span className="summary-total">/{total}</span>
            </span>
          ) : (
            count
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;