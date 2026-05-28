/**
 * Xuất dữ liệu mảng đối tượng thành file CSV (hỗ trợ tiếng Việt trong Excel bằng BOM)
 * @param {Array<Object>} data 
 * @param {string} filename 
 */
export function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  
  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
