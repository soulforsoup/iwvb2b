document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const searchBar = document.getElementById('searchBar');
    const productTable = document.getElementById('productTable').getElementsByTagName('tbody')[0];

    let products = [];

    // Replace with your Google Spreadsheet ID and API key
    const googleSpreadsheetId = '1TF2hAiXg5KfLARRnVSdT0YroW3su0f3K-iERs2RZjAw';
    const apiKey = 'AIzaSyBn1cNKwaNPl9WeK8_gQtU0p8ieBg0pUjQ';
    const sheetName = 'Sheet1'; // Replace with your sheet name
    const googleSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSpreadsheetId}/values/${sheetName}!A1:D?key=${apiKey}`;

    // Fetch data from Google Sheet
    fetch(googleSheetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.values) {
                products = data.values.slice(1).map(row => ({
                    productName: row[0] ? row[0].toString() : '', // Ensure productName is a string
                    unitOfMeasure: row[1] ? row[1].toString() : '', // Ensure unitOfMeasure is a string
                    salesPrice: row[2] ? row[2].toString() : '', // Ensure salesPrice is a string
                    indent: row[3] === 'TRUE'
                }));

                // Render products in table
                renderProducts(products);
            } else {
                console.error('No data found in the sheet.');
            }
        })
        .catch(error => console.error('Error fetching data:', error));

    // Search functionality
    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value.toLowerCase();
        const filteredProducts = products.filter(product => 
            product.productName && product.productName.toLowerCase().includes(searchTerm)
        );
        renderProducts(filteredProducts);
    });

    // Render products in table
    function renderProducts(products) {
        productTable.innerHTML = '';
        products.forEach(product => {
            const row = productTable.insertRow();
            row.insertCell(0).textContent = product.productName;
            row.insertCell(1).textContent = product.unitOfMeasure;
            row.insertCell(2).textContent = product.salesPrice;
            row.insertCell(3).textContent = product.indent ? '✓' : '';
        });
    }

    // Download button functionality
    downloadBtn.addEventListener('click', () => {
        window.location.href = 'https://docs.google.com/spreadsheets/d/1m4-xtrkYzrqrTQkqIyxjXJocSuz3NX548exzHUVx_m8/pub?gid=1107268124&single=true&output=pdf';
    });
});