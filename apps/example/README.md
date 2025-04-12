# Notion CMS Example

This is an example project demonstrating how to use Notion as a CMS (Content Management System) with Next.js. The project showcases how to fetch and display data from a Notion database using the Notion API.

## Features

- Next.js 13+ with App Router
- Notion API integration
- TypeScript support
- Tailwind CSS for styling
- Environment variables for configuration

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/mikemajara/notion-cms-example.git
cd notion-cms-example
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your Notion API token:

```bash
NOTION_TOKEN=your_notion_api_token_here
```

4. Update the `DATABASE_ID` in `src/app/page.tsx` with your Notion database ID.

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

- `NOTION_TOKEN`: Your Notion API integration token
- `DATABASE_ID`: The ID of your Notion database (currently hardcoded in `src/app/page.tsx`)

## License

MIT
