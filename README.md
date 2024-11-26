# OH Canyon Market

A Next.js application for managing inventory using the Square API.

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/OH_CanyonMarket.git
cd OH_CanyonMarket
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Replace `your_square_access_token_here` with your actual Square Access Token
```bash
cp .env.local.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SQUARE_ACCESS_TOKEN`: Your Square API Access Token
  - This token is used to authenticate requests to the Square API
  - Can be obtained from the Square Developer Dashboard
  - Must be configured in both development (`.env.local`) and production environments

### Setting up in Vercel

When deploying to Vercel:

1. Go to your project settings in the Vercel dashboard
2. Navigate to the "Environment Variables" section
3. Add `NEXT_PUBLIC_SQUARE_ACCESS_TOKEN` with your Square Access Token
4. Redeploy your application

## Features

- Inventory management integrated with Square API
- Real-time inventory tracking
- Category management
- Vendor management
- Purchase order system
- Reporting capabilities

## Development

- Built with Next.js 13+ App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Square API integration for inventory management

## License

[MIT](LICENSE)
