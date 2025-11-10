<div>
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/docker-required-blue.svg" alt="Docker">
  <img src="https://img.shields.io/badge/status-beta-orange.svg" alt="Development Status">
  <a href="https://github.com/AlpinAI/2ly" style="float: right;"><img src="https://img.shields.io/badge/github-star-yellow?style=flat&logo=github&logoColor=white" alt="Star"></a>
</div>

<br>

# One Platform. Any Agent. All Tools.

**2LY is the infrastructure layer for AI agent tooling.**

Stop rebuilding the same tools for every agent framework. 2LY gives you a private tool registry with embedded runtimes that works across any agent environment—whether you're using LangChain, CrewAI, AutoGPT, or building custom agents.


<div align="center">
    <p><em>2-minute product walkthrough (click to unmute)</em></p>
  <video src="https://github.com/user-attachments/assets/15f7f238-d265-44de-a3e1-50864a5d3aeb" 
         controls 
         loop
         style="max-width: 100%; height: auto;">
  </video>
</div>


## ✨ Why 2LY?

### ⚡ Ship Faster
Connect your agents to MCP servers, REST APIs, or custom functions through one unified interface. Tools run in isolated, secure runtimes—no dependency conflicts, no environment setup headaches.

### 🔧 Your Tools, Your Registry
Unlike platforms that lock you into their tool marketplace, 2LY lets you build and manage your own private catalogue. Import existing tools, wrap your internal APIs, or create custom functions—you control what's available to your agents.

### 👁️ Stay in Control
Built-in observability shows you exactly how your agents interact with tools. Track usage, debug failures, and optimize performance from a single dashboard.

### 🏠 Own Your Stack
Self-hosted and open source. Your tools, your infrastructure, your data.

> Currently supporting **Model Context Protocol (MCP)** with REST APIs and coded functions in active development.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v22+
- [Docker](https://docs.docker.com/)

### Installation
```bash
git clone https://github.com/AlpinAI/2ly.git
cd 2ly
npm run start # calls docker compose
```

Access the dashboard at **http://localhost:8888**, create your workspace, and follow our 3-step onboarding (takes 2 minutes).

---

## 🌐 Distributed Architecture

Unlike traditional gateways that proxy HTTP requests to fixed endpoints, 2LY uses message-based pub-sub where runtimes register dynamically from anywhere. Agents publish requests to topics; the broker routes to available runtimes regardless of location (cloud, edge, behind NAT). Message persistence and async communication enable fan-out queries, automatic failover, and zero-downtime deployments without orchestration code.

<p align="center">
<img width="784" height="242" alt="2LY Architecture" src="https://github.com/user-attachments/assets/4a7810b1-51f8-4bc0-ad73-cff62db420c7" style="border-radius: 15px;" />
</p>

### Key Components

1. **Runtimes** - Lightweight execution environments that run services anywhere (cloud, edge, on-premise)
2. **Registry & Discovery (Dgraph)** - Graph database storing runtime capabilities, tool schemas, and deployment topology
3. **Message Broker (NATS)** - Handles all agent-to-runtime communication through pub-sub messaging and complete decoupling of agent and runtime locations
4. **Backend** - Orchestrates runtime lifecycle, enforces routing policies, provides authentication, rate limiting, and observability
5. **User Interface** - Workspace for configuration, management and monitoring of tools and runtimes

---

## 🗺️ Roadmap

2LY is evolving rapidly with new features and capabilities being added regularly. Have an idea or need something specific? We'd love to hear from you - [submit a feature request](https://github.com/AlpinAI/2ly/issues/new?template=feature_request.md)!

---

## 📚 Resources

- 📖 [Product Documentation](https://docs.2ly.ai/getting-started/welcome)
- 🌐 [Product Website](https://2ly.ai)
- 💻 [Development Guidelines](/dev/README.md)

---

## 📄 License

Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Ready to Take Control of Your AI Tool Ecosystem?

⭐ [Star this repo](https://github.com/AlpinAI/2ly/stargazers) • 🍴 [Fork for your projects](https://github.com/AlpinAI/2ly/fork) • 💬 [Join our Discord community](https://discord.gg/2ly-ai)
