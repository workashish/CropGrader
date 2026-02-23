import { GradingResult, BatchGradingResult, PriceEstimation } from '@/types/grading';

// CSV Export
export const exportSingleResultsToCSV = (results: GradingResult[]): string => {
  const headers = [
    'ID',
    'Timestamp',
    'Crop Type',
    'Grade',
    'Confidence (%)',
    'Overall Score',
    'Color Quality',
    'Size & Shape',
    'Surface Quality',
    'Disease & Pest',
    'Ripeness',
    'Overall Appeal',
    'Requires Verification',
  ];

  const rows = results.map(r => [
    r.id,
    new Date(r.timestamp).toISOString(),
    r.cropType,
    r.grade,
    r.confidence,
    r.overallScore,
    r.scores.colorQuality,
    r.scores.sizeShape,
    r.scores.surfaceQuality,
    r.scores.diseasePest,
    r.scores.ripeness,
    r.scores.overallAppeal,
    r.requiresHumanVerification ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const exportBatchResultsToCSV = (batches: BatchGradingResult[]): string => {
  const headers = [
    'Batch ID',
    'Timestamp',
    'Images Count',
    'Average Grade',
    'Average Score',
    'Min Score',
    'Max Score',
    'Standard Deviation',
    'Consistency Score',
    'Outliers Count',
    'Recommendation',
  ];

  const rows = batches.map(b => [
    b.id,
    new Date(b.timestamp).toISOString(),
    b.results.length,
    b.averageGrade,
    b.averageScore,
    b.minScore,
    b.maxScore,
    b.standardDeviation,
    b.consistencyScore,
    b.outliers.length,
    `"${b.batchRecommendation.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const exportPriceEstimationsToCSV = (estimations: PriceEstimation[]): string => {
  const headers = [
    'Crop Type',
    'Grade',
    'Quantity (kg)',
    'Region',
    'Base Price (₹/kg)',
    'Grade Adjustment (₹)',
    'Organic Premium (%)',
    'Pesticide-Free Premium (%)',
    'Self-Declaration Premium (%)',
    'Total Premium (%)',
    'Final Price per kg (₹)',
    'Total Price (₹)',
  ];

  const rows = estimations.map(e => [
    e.cropType,
    e.grade,
    e.quantity,
    e.region,
    e.basePrice,
    e.gradeAdjustment,
    e.organicPremium,
    e.pesticideFreePremium,
    e.selfDeclarationPremium,
    e.totalPremiumPercentage,
    e.finalPricePerKg,
    e.totalPrice,
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Download helper
export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCSV = (content: string, filename: string) => {
  downloadFile(content, filename, 'text/csv;charset=utf-8;');
};

// PDF Export (generates HTML that can be printed as PDF)
export const generatePDFContent = (
  singleResults: GradingResult[],
  batchResults: BatchGradingResult[],
  priceEstimations: PriceEstimation[]
): string => {
  const timestamp = new Date().toLocaleString();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AgriGrade Report - ${timestamp}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #16a34a; border-bottom: 3px solid #16a34a; padding-bottom: 10px; }
    h2 { color: #1f2937; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    .grade-A { background: #d1fae5; color: #065f46; }
    .grade-B { background: #dbeafe; color: #1e40af; }
    .grade-C { background: #fef3c7; color: #92400e; }
    .grade-D { background: #fee2e2; color: #991b1b; }
    .summary { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; margin: 20px 0; }
    .stat { display: inline-block; margin-right: 30px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #16a34a; }
    .stat-label { font-size: 12px; color: #6b7280; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>🌿 AgriGrade Assessment Report</h1>
  <p>Generated: ${timestamp}</p>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-value">${singleResults.length}</div>
      <div class="stat-label">Single Analyses</div>
    </div>
    <div class="stat">
      <div class="stat-value">${batchResults.length}</div>
      <div class="stat-label">Batch Analyses</div>
    </div>
    <div class="stat">
      <div class="stat-value">${priceEstimations.length}</div>
      <div class="stat-label">Price Estimates</div>
    </div>
  </div>
  
  ${singleResults.length > 0 ? `
  <h2>Single Crop Grading Results</h2>
  <table>
    <thead>
      <tr>
        <th>Crop</th>
        <th>Grade</th>
        <th>Score</th>
        <th>Confidence</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${singleResults.map(r => `
        <tr>
          <td>${r.cropType}</td>
          <td class="grade-${r.grade}"><strong>${r.grade}</strong></td>
          <td>${r.overallScore}%</td>
          <td>${r.confidence}%</td>
          <td>${new Date(r.timestamp).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${batchResults.length > 0 ? `
  <h2>Batch Grading Results</h2>
  <table>
    <thead>
      <tr>
        <th>Images</th>
        <th>Avg Grade</th>
        <th>Avg Score</th>
        <th>Consistency</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${batchResults.map(b => `
        <tr>
          <td>${b.results.length}</td>
          <td class="grade-${b.averageGrade}"><strong>${b.averageGrade}</strong></td>
          <td>${b.averageScore}%</td>
          <td>${b.consistencyScore}%</td>
          <td>${new Date(b.timestamp).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${priceEstimations.length > 0 ? `
  <h2>Price Estimations</h2>
  <table>
    <thead>
      <tr>
        <th>Crop</th>
        <th>Grade</th>
        <th>Qty (kg)</th>
        <th>Region</th>
        <th>Price/kg</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${priceEstimations.map(e => `
        <tr>
          <td>${e.cropType}</td>
          <td class="grade-${e.grade}"><strong>${e.grade}</strong></td>
          <td>${e.quantity}</td>
          <td>${e.region}</td>
          <td>₹${e.finalPricePerKg}</td>
          <td><strong>₹${e.totalPrice.toLocaleString()}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  <p style="margin-top: 40px; color: #6b7280; font-size: 12px; text-align: center;">
    Report generated by AgriGrade AI-Powered Crop Assessment System
  </p>
</body>
</html>
  `;
};

export const openPDFPreview = (htmlContent: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Auto-trigger print dialog
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};
