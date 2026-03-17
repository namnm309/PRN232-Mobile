/**
 * Transform DiaGioiHanhChinhVN JSON (Province > District > Ward) to our address format.
 * Nguồn: https://github.com/kenzouno1/DiaGioiHanhChinhVN
 */
const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '../data/diagioihanhchinh.json');
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const provinces = [];
const districtsByProvince = {};
const wardsByDistrict = {};

raw.forEach((p) => {
  const provinceId = parseInt(p.Id, 10) || 0;
  if (!provinceId) return;

  provinces.push({
    provinceID: provinceId,
    provinceName: p.Name || '',
  });

  if (!districtsByProvince[provinceId]) {
    districtsByProvince[provinceId] = [];
  }

  (p.Districts || []).forEach((d, dIdx) => {
    const districtId = provinceId * 1000 + (dIdx + 1);

    districtsByProvince[provinceId].push({
      districtID: districtId,
      provinceID: provinceId,
      districtName: d.Name || '',
    });

    if (!wardsByDistrict[districtId]) {
      wardsByDistrict[districtId] = [];
    }

    (d.Wards || []).forEach((w) => {
      const wardCode = String(w.Id || '').padStart(6, '0');
      wardsByDistrict[districtId].push({
        wardCode,
        districtID: districtId,
        wardName: w.Name || '',
      });
    });
  });
});

const out = {
  provinces,
  districtsByProvince,
  wardsByDistrict,
};

fs.writeFileSync(
  path.join(__dirname, '../data/addressData.json'),
  JSON.stringify(out, null, 0)
);

console.log('Generated:', provinces.length, 'provinces');
console.log('Total districts:', Object.values(districtsByProvince).flat().length);
console.log('Total wards:', Object.values(wardsByDistrict).flat().length);
