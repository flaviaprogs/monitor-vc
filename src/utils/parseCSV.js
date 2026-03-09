// 📁 src/utils/parseCSV.js
export function parseCSV(file, callback) {
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i]?.trim();
        });
        return obj;
      });
      callback(data.filter(row => Object.keys(row).length > 1));
    };
    reader.readAsText(file);
  }
