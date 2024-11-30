# Lighthouse MD - Medical Document Assistant

## Overview
Lighthouse MD is a web-based application designed to help users understand and interact with their medical documents using AI assistance. The application runs completely in the browser, mostly utilizing local AI models for enhanced privacy and offline capabilities.

## Features

### 📄 Document Management
- **Multiple Format Support**: Upload and process various document formats (.pdf, .jpg)
- **Real-time Status**: Visual indicators for document processing stages
- **Document Summary**: Automated generation of document summaries

### 🤖 AI-Powered Analysis
- **Local Processing**: Uses Gemini Nano model that runs directly in the browser
- **Intelligent Summarization**: Automatically generates concise summaries of medical documents using `gemini-1.5-flash` analysis API
- **Smart Context**: Maintains context across multiple documents for more accurate responses
- **Vector Database**: Uses in-browser vector storage for efficient document retrieval

### 💬 Interactive Chat
- **Context-Aware Responses**: AI responses based on uploaded document content
- **Source References**: Transparently shows which parts of documents were used for responses
- **Real-time Interaction**: Immediate responses without server latency

### 🌐 Multilingual Support
- **18 Languages Supported**:
  - English
  - Arabic
  - Bengali
  - German
  - Spanish
  - Hindi
  - Italian
  - Japanese
  - Dutch
  - Polish
  - Portuguese
  - Russian
  - Thai
  - Turkish
  - Vietnamese
  - Chinese (Simplified)
  - Chinese (Traditional)
  
- **Language Selection**: Choose output language for summaries
- **Cross-lingual Understanding**: Process documents in one language and get responses in another
- **Multi-lingustic Chat**: Chat in any of the supported languages

### 🔒 Privacy & Security
- **No Server Storage**: Documents are not uploaded and stored in external servers
- **Offline Capable**: Works without an internet connection after initial analysis

## Technical Stack


### AI/ML Components
- Gemini Nano for interactions
- Gemini Flash for file processing
- IndexedDB for vector storage
- Transformers.js for feature extraction
- LangChain for text splitting

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone git@github.com:utsabc/lighthouse-md.git
# Navigate to project directory
cd lighthouse-md

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Usage Guide

1. **Upload Documents**
   - Click the "Upload Document" button in the Documents panel
   - Select one or multiple medical documents
   - Wait for processing indicators to complete

2. **Review Summaries**
   - View automatically generated summaries for each document
   - Edit summaries if needed using the edit button
   - Select desired output language from the dropdown
   - Confirm the summary to enable chat functionality

3. **Chat with Documents**
   - Type questions about your medical documents in the chat panel
   - View AI responses with referenced source sections
   - Click on references to see the original context
   - Continue the conversation naturally with follow-up questions

## Browser Compatibility
- Chrome (recommended) v90+
- Firefox v90+
- Safari v14+
- Edge v90+


## Disclaimer
This application is designed to assist in reviewing medical documents but should not be used as a primary diagnostic tool or substitute for professional medical advice. Always consult healthcare professionals for medical decisions.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
