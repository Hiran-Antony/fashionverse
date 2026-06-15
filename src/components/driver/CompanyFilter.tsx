// ═══════════════════════════════════════════════════════════════
// FASHIONVERSE DELIVERY HUB — Company Filter Pills
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useDriverStore } from '../../store/driverStore';

export default function CompanyFilter() {
  const { companies, selectedCompanyId, setSelectedCompanyId } = useDriverStore();
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  return (
    <div className="company-filter">
      {/* All pill */}
      <button
        className={`company-pill ${selectedCompanyId === null ? 'active' : ''}`}
        onClick={() => setSelectedCompanyId(null)}
      >
        All
      </button>

      {/* Company pills */}
      {companies.map((company) => {
        const isActive = selectedCompanyId === company.id;
        const showLogo = company.logo_url && !failedLogos.has(company.id);

        return (
          <button
            key={company.id}
            className={`company-pill ${isActive ? 'active' : ''}`}
            onClick={() => setSelectedCompanyId(isActive ? null : company.id)}
          >
            {showLogo ? (
              <img
                src={company.logo_url!}
                alt={company.name}
                className="dh-company-logo"
                onError={() =>
                  setFailedLogos((prev) => new Set(prev).add(company.id))
                }
              />
            ) : (
              <span
                className="dh-company-initial"
                style={{ background: company.brand_color }}
              >
                {company.name.charAt(0)}
              </span>
            )}
            {company.name}
          </button>
        );
      })}
    </div>
  );
}
