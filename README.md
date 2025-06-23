# Canvify.fun - AI Canvas Analyzer with Event Scheduler

A comprehensive tool for planning, analyzing, and managing AI projects with an integrated event scheduler for task management and project tracking.

## 🚀 Features

### AI Canvas Analyzer
- **12-Section Canvas Framework**: Comprehensive planning tool for both traditional and generative AI projects
- **AI-Powered Analysis**: Get intelligent recommendations and quality scores for your canvas sections
- **Real-time Quality Scoring**: Visual indicators showing the completeness and quality of each section
- **Export & Import**: Save your work as JSON or export professional PDF reports
- **Interactive Chat Assistant**: Get contextual help and suggestions powered by OpenAI

### Event Scheduler
- **Task Management**: Create, edit, delete, and track tasks with deadlines
- **Calendar View**: Visual representation of tasks in a monthly calendar format
- **List View**: Detailed task list with priority indicators and status tracking
- **Priority System**: High, medium, and low priority classification
- **Status Tracking**: Pending, in-progress, and completed task states
- **Deadline Notifications**: Automatic alerts for upcoming deadlines
- **Data Persistence**: Save and load scheduled tasks using JSON format
- **Export/Import**: Share task schedules with team members

### Canvas Sections
1. **Task Type** - Define the core AI task (prediction/generation)
2. **Human Judgment & Oversight** - Specify required human review processes
3. **Action** - Describe actions based on AI output
4. **Outcome** - Define desired impact and results
5. **Input Data/Prompts/Features** - Specify required inputs
6. **Training/Fine-tuning Data** - Define training data requirements
7. **Feedback Loop** - Plan for continuous improvement
8. **Value Proposition** - Articulate business value
9. **Risks & Responsible AI** - Address ethical and safety concerns
10. **Model Selection & Prompt Engineering** - Technical implementation details
11. **Content Moderation & Quality Control** - Output validation processes
12. **Transparency & User Experience** - User interaction design

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI Integration**: OpenAI API (GPT-3.5-turbo, GPT-4)
- **Proxy Server**: Node.js with Express-like functionality
- **Storage**: Browser localStorage with JSON export/import
- **Styling**: Custom CSS with modern design principles

## 📁 Project Structure

```
├── index.html              # Main application entry point
├── css/                    
│   ├── style.css          # Main application styling
│   └── scheduler.css      # Event scheduler specific styles
├── js/                     
│   ├── script.js          # Main canvas functionality
│   ├── chat.js            # AI assistant and chat widget
│   ├── scheduler.js       # Event scheduler functionality
│   └── proxy-server.js    # Node.js proxy for OpenAI API
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd canvify-fun
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up OpenAI API key**
   ```bash
   export OPENAI_API_KEY=your_openai_api_key_here
   ```
   Or update the key directly in `js/proxy-server.js`

4. **Start the proxy server**
   ```bash
   npm run proxy
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:8000`

## 💡 Usage

### Canvas Planning
1. Fill out the 12 canvas sections with details about your AI project
2. Use the AI assistant for suggestions and guidance
3. Click "Analyze Canvas" to get quality scores and recommendations
4. Save your work locally or export as PDF for sharing

### Event Scheduling
1. Click the "Event Scheduler" button in the sidebar
2. Add tasks with titles, descriptions, deadlines, and priorities
3. Switch between list and calendar views
4. Track progress by updating task status
5. Export/import task schedules for team collaboration

### AI Assistant
1. Click the chat widget in the bottom-right corner
2. Ask questions about your canvas or get improvement suggestions
3. The assistant has context about your current canvas content
4. Use different OpenAI models based on your needs

## 🎨 Design Features

- **Modern UI/UX**: Clean, professional interface with intuitive navigation
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Visual Feedback**: Quality scores, progress indicators, and status badges
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Dark/Light Themes**: Automatic theme detection and manual toggle options

## 📊 Quality Scoring System

- **High (70-100%)**: Excellent content, specific and comprehensive
- **Medium (40-69%)**: Good content, could use more detail
- **Low (0-39%)**: Needs significant improvement

## 🔒 Privacy & Security

- **Local Storage**: All data is stored locally in your browser
- **API Security**: OpenAI API calls are proxied through a local server
- **No Data Collection**: No personal data is collected or transmitted to external services
- **Export Control**: You control when and how your data is shared

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section in the documentation
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Contact the development team

## 🔮 Roadmap

- [ ] Team collaboration features
- [ ] Advanced analytics and reporting
- [ ] Integration with project management tools
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced AI model options
- [ ] Custom canvas templates

---

**Made with ❤️ for the AI community**

Transform your AI project planning with Canvify.fun - where strategic thinking meets practical execution.