<div>
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/docker-required-blue.svg" alt="Docker">
  <img src="https://img.shields.io/badge/status-beta-orange.svg" alt="Development Status">
  <a href="https://github.com/skilder-ai/skilder" style="float: right;"><img src="https://img.shields.io/badge/github-star-yellow?style=flat&logo=github&logoColor=white" alt="Star"></a>
</div>

<br>

# One Platform. Any Agent. All Tools.

**Skilder is the infrastructure layer for AI agent tooling.**

Stop rebuilding the same tools for every agent framework. Skilder gives you a private tool registry with embedded runtimes that works across any agent environment—whether you're using LangChain, CrewAI, AutoGPT, or building custom agents.

<div align="center">
    <p><em>2-minute product walkthrough (click to unmute)</em></p>
  <video src="https://github.com/user-attachments/assets/15f7f238-d265-44de-a3e1-50864a5d3aeb" 
         controls 
         loop
         style="max-width: 100%; height: auto;">
  </video>
</div>

## ✨ Why Skilder?

### ⚡ Ship Faster

**Stop reinventing the wheel.** Connect your agents to MCP servers, REST APIs, or custom functions through one unified interface. Tools run in isolated, secure runtimes—no dependency conflicts, no environment setup headaches.

**Time saved:** What takes weeks to build (tool orchestration, runtime management, observability) works out of the box. Go from idea to production-ready agent in hours, not months.

### 🔧 Your Tools, Your Registry

Unlike platforms that lock you into their tool marketplace, Skilder lets you build and manage your own private catalog. Import existing tools, wrap your internal APIs, or create custom functions—you control what's available to your agents.

### 📊 Cost Savings

Curate exactly the tools your agents need to reduce context noise and boost tool success rates with clear, tailored names and descriptions. Optimize outputs through post-processing and trim payloads before they reach your agent’s context.

### 👁️ Stay in Control

Built-in observability shows you exactly how your agents interact with tools. Track usage, debug failures, and optimize performance from a single dashboard.

**Enterprise-ready:** Audit trails, usage analytics, and debugging tools built-in. Understand agent behavior, catch issues early, and optimize tool performance without third-party monitoring services.

### 🏠 Own Your Stack

Self-hosted and open source. Your tools, your infrastructure, your data.

**Privacy & Security:** Sensitive data never leaves your infrastructure. API keys stay encrypted in your environment. Full control over data retention, compliance, and security policies.

> Currently supporting **Model Context Protocol (MCP)** with REST APIs and coded functions in active development.

---

## 💡 Use Cases

### LangChain Agent + GitHub Integration

Connect your LangChain agents to GitHub repositories via MCP. Create issues, review PRs, analyze code—all through natural language. No custom tool code needed.

### Multi-Agent Systems with Shared Tools

Deploy multiple specialized agents (research, coding, documentation) that share access to common tools. Skilder handles routing, load balancing, and ensures consistent tool access across all agents.

### Edge AI with Distributed Runtimes

Run tool runtimes closer to your data—on-premise servers, edge devices, or regional deployments. Reduce latency, comply with data residency requirements, and maintain control over sensitive operations.

### Custom Internal Tool Ecosystems

Wrap your internal APIs, databases, and services as agent-accessible tools. Create a private catalogue tailored to your organization's workflows without exposing tools publicly or depending on external marketplaces.

---

## 🚀 Quick Start

> **Developers & Contributors**: See [Development Documentation](/dev/README.md) for local setup, testing, and contribution guidelines.

### Prerequisites

- [Docker](https://docs.docker.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/skilder-ai/skilder.git
cd skilder

# Start all services
docker compose up -d

# View logs (optional)
docker compose logs -f
```

Access the dashboard at **http://localhost:8888**

### ⚡ Quick Win: Your First Tool in 2 Minutes

1. **Create your workspace** - Set up your admin account
2. **Follow the onboarding** - 3 guided steps to understand Skilder's capabilities
3. **Connect an MCP server** - Choose from popular servers (Filesystem, GitHub, Weather) or add your own
4. **Test your tools** - Use the built-in tool tester to verify everything works
5. **Connect your agent** - Copy the connection details and integrate with your agent framework

### 🎯 What's Next?

After completing the onboarding, here's how to get the most out of Skilder:

#### 1. Add More MCP Servers

- Database connectors (PostgreSQL, MySQL, MongoDB)
- Cloud platform integrations (AWS, GCP, Azure)
- Development tools (Git, Docker, CI/CD)
- Communication platforms (Slack, Discord, Email)

#### 2. Connect Your Agents

Integrate Skilder with your preferred agent framework:

- **LangChain** - Use the [LangChain MCP Adapters](https://github.com/langchain-ai/langchain-mcp-adapters)
- **N8N** - Connect an MCP Client Node to your agent and configure with MCP Streamable HTTP
- **Langflow** - Add an MCP Tools component and configure using MCP SSE
- **Custom Agents** - Leverage the Model Context Protocol (MCP) to connect to any compatible agent

#### 3. Monitor & Optimize

Use the dashboard to:

- Track tool usage patterns and identify bottlenecks
- Debug failed tool calls with detailed logs
- Analyze agent behavior and optimize tool selection
- Set up alerts for runtime health and performance

#### 4. Deploy Additional Runtimes

Start with the default runtime, but add more for:

- **Geographic distribution** - Run runtimes closer to your users or data sources
- **Workload isolation** - Separate production, staging, and development environments
- **Scalability** - Distribute load across multiple runtime instances

See [Runtime Documentation](https://docs.skilder.ai/core-concepts/runtime) for deployment options (Docker, Kubernetes, bare metal).

---

## 🌐 Distributed Architecture

Unlike traditional gateways that proxy HTTP requests to fixed endpoints, Skilder uses message-based pub-sub where runtimes register dynamically from anywhere. Agents publish requests to topics; the broker routes to available runtimes regardless of location (cloud, edge, behind NAT). Message persistence and async communication enable fan-out queries, automatic failover, and zero-downtime deployments without orchestration code.

<p align="center">
<img width="784" height="242" alt="Skilder Architecture" src="https://github.com/user-attachments/assets/f257c6f8-4cf0-4222-ba2c-16ed67f8b02c" style="border-radius: 15px;" />
</p>

### Key Components

1. **Runtimes** - Lightweight execution environments that run services anywhere (cloud, edge, on-premise)
2. **Registry & Discovery (Dgraph)** - Graph database storing runtime capabilities, tool schemas, and deployment topology
3. **Message Broker (NATS)** - Handles all agent-to-runtime communication through pub-sub messaging and complete decoupling of agent and runtime locations
4. **Backend** - Orchestrates runtime lifecycle, enforces routing policies, provides authentication, rate limiting, and observability
5. **User Interface** - Workspace for configuration, management and monitoring of tools and runtimes

---

## 🗺️ Roadmap

Skilder is evolving rapidly with new features and capabilities being added regularly. Have an idea or need something specific? We'd love to hear from you - [submit a feature request](https://github.com/skilder-ai/skilder/issues/new?template=feature_request.md)!

---

## 📚 Resources

### For Users

- 📖 [Product Documentation](https://docs.skilder.ai/getting-started/installation)
- 🌐 [Product Website](https://skilder.ai)

### For Developers & Contributors

- 💻 [Development Guidelines](/dev/README.md) - Local setup, testing, and contribution guide

---

## 📄 License

Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Ready to Take Control of Your AI Tool Ecosystem?

⭐ [Star this repo](https://github.com/skilder-ai/skilder/stargazers) • 🍴 [Fork for your projects](https://github.com/skilder-ai/skilder/fork) • 💬 [Join our Discord community](https://discord.gg/skilder-ai)
