// Helper function to read partner code from either key
function getPartnerCode(d) {
    return d.sifra_kup || d.sifra_kup_z;
}

// Assuming the existing mappings are in place
const exampleMapping = data.map(d => ({
    ...d,
    sifra_kup: getPartnerCode(d),
    // Keep other existing mappings intact
}));

// Filter usage updated to reflect the new partner code key
const filteredData = exampleMapping.filter(d => {
    return d.sifra_kup === someValue; // Replace 'someValue' with the actual filter condition
});

// Rest of the service code remains unchanged