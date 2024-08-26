# IWantVeggies B2B Wholesale Pricing

## Description

IWantVeggies B2B Wholesale Pricing is a web-based application that provides up-to-date wholesale pricing for fresh vegetables and fruits in Singapore. This tool is designed to help businesses easily access and navigate through our current product offerings and their respective prices.

## Features

- **Up-to-date Pricing**: Prices are automatically updated from the Google Sheets database using cron.
- **Search Functionality**: Easily find specific products using the search bar.
- **Sorting**: Sort products by name, unit of measure, price, or indent status.
- **Responsive Design**: Optimized for both desktop and mobile viewing.
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing in any environment.
- **Printable Version**: Generate a printer-friendly version of the price list.
- **Password Protection**: Secure access to pricing information for authorized users only.

## Technology Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Node.js (for data updating script)
- GitHub Actions (for automated data updates)
- GitHub Pages (for hosting)
- [StatiCrypt](https://github.com/robinmoisson/staticrypt) (for password protection)

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/iwvb2b.git
   ```
2. Navigate to the project directory:
   ```
   cd iwvb2b
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. To update the product data manually, run:
   ```
   npm run update-data
   ```
5. To encrypt the HTML file with StatiCrypt (if you're a maintainer):
   ```
   npx staticrypt index.html -p your_password_here
   ```
   This will generate an encrypted `index.html` file.

## Usage

Visit [https://yourusername.github.io/iwvb2b](https://yourusername.github.io/iwvb2b) to access the live pricing tool.

- Enter the provided password when prompted to access the pricing information.
- Use the search bar to find specific products.
- Click on column headers to sort the data.
- Toggle dark mode using the moon/sun icon in the header.
- Click the download button to generate a printable version.

## Password Protection

This site uses [StatiCrypt](https://github.com/robinmoisson/staticrypt) to implement password protection for our wholesale pricing information. This ensures that only authorized users can access our pricing details.

To access the pricing information:
1. Visit the website
2. Enter the provided password when prompted
3. Once authenticated, you'll have full access to the pricing tool

If you're an authorized user and don't have the password, please contact us at [zecryne@gmail.com](mailto:zecryne@gmail.com).

## Deployment

When deploying updates to the live site:

1. Make sure all changes are committed and pushed to the main branch.
2. Run the StatiCrypt encryption on your `index.html` file.
3. Commit the encrypted `index.html` file.
4. Push to GitHub, which will trigger the GitHub Pages deployment.

Note: Always keep a backup of the unencrypted `index.html` file for future updates.

## Acknowledgements

- [Font Awesome](https://fontawesome.com) for icons
- [Google Sheets API](https://developers.google.com/sheets/api) for data management
- [StatiCrypt](https://github.com/robinmoisson/staticrypt) for password protection
