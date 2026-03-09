export function exportToCSV(data, fileName = 'dados.csv') {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(field => JSON.stringify(row[field] ?? '')).join(','))
    ].join('\n');
  
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
