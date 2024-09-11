# IWantVeggies B2B Wholesale Pricing

## Description

IWantVeggies B2B Wholesale Pricing is a web-based application that provides up-to-date wholesale pricing for fresh vegetables and fruits in Singapore. This tool is designed to help businesses easily access and navigate through our current product offerings and their respective prices.

## Features

- **Up-to-date Pricing**: Prices are automatically updated from a JSON file hosted on GitHub.
- **Search Functionality**: Easily find specific products using the search bar.
- **Sorting**: Sort products by name, unit of measure, price, or indent status.
- **Responsive Design**: Optimized for both desktop and mobile viewing.
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing in any environment.
- **Printable Version**: Generate a printer-friendly version of the price list.
- **Password Protection**: Secure access to pricing information for authorized users only.
- **Order Summary**: Select products and quantities to generate a clipboard-friendly order summary.
- **WhatsApp Integration**: Easily send orders via WhatsApp.

## Technology Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- GitHub Pages (for hosting)
- [StatiCrypt](https://github.com/robinmoisson/staticrypt) (for password protection)

## File Structure

- `index.html`: The encrypted main entry point of the application.
- `indexworking.html`: The unencrypted version of the main page.
- `indexmaintenance.html`: A maintenance page to be used when the site is under maintenance.
- `script.js`: Contains all the JavaScript functionality for the application.
- `styles.css`: Contains all the styling for the application.
- `README.md`: This file, containing information about the project.

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/iwvb2b.git
   ```
2. Navigate to the project directory:
   ```
   cd iwvb2b
   ```
3. To encrypt the HTML file with StatiCrypt (if you're a maintainer):
   ```
   staticrypt indexworking.html
   ```
   This will generate an encrypted `index.html` file. You'll be prompted to enter the password during the encryption process.

## Usage

Visit the hosted GitHub Pages URL to access the live pricing tool.

- Enter the provided password when prompted to access the pricing information.
- Use the search bar to find specific products.
- Click on column headers to sort the data.
- Toggle dark mode using the moon/sun icon in the header.
- Click the download button to generate a printable version.
- Select products and quantities, then use the "Copy Order" button to generate an order summary.
- Use the WhatsApp button to send your order directly via WhatsApp.

## Password Protection

This site uses [StatiCrypt](https://github.com/robinmoisson/staticrypt) to implement password protection for our wholesale pricing information. This ensures that only authorized users can access our pricing details.

## Deployment

The site is hosted on GitHub Pages. When deploying manual updates to the live site:

1. Make sure all changes are committed and pushed to the main branch.
2. Run the StatiCrypt encryption on your `indexworking.html` file to generate the encrypted `index.html`.
3. Commit both the `indexworking.html` and the encrypted `index.html` files.
4. Push to GitHub, which will trigger the GitHub Pages deployment.

## Maintenance Mode

In case you need to take the site offline for maintenance:

1. Rename the current `index.html` to `index_encrypted.html`.
2. Rename `indexmaintenance.html` to `index.html`.
3. When maintenance is complete, reverse these steps.

## Acknowledgements

- [Font Awesome](https://fontawesome.com) for icons
- [StatiCrypt](https://github.com/robinmoisson/staticrypt) for password protection
