BEFORE

* The user could select one or several upstream regsitry
* The workspace would synchronize all the servers contained in the upstream registry into the local database

AFTER

* There will be ONLY ONE, private registry -> created at the same time than workspace creation (done)
* In the settings, the user CANNOT add other upstream registry
* In the settings, the tab is now called "Private Registry" and the user can "Add MCP Server" to the registry
* The "Add MCP Server" feature is described below
* The onboarding step 1 called "choose-mcp-registry" must be removed all-together
    * step 2 becomes step 1
    * step 3 becoems step 2
    * a new step 3 called "Test your tools" must be created
        * create the init in the backend
        * create the card in the frontend
        * the completion logic will be added later

FEATURES in detail

* Add MCP Server
    * Must be available from different part of the application
        * Settings: Private registry
        * Command Palette
        * Browse MCP Servers step when adding a source
    * It must open a bottom panel, with horizontal sliding like "Add Source" workflow
    * In this panel the user must first choose to add (cards)
        * From an upstream regsitry
            * Display a "browser" (like Browse MCP Servers)
            * With a search bar
            * And an option to select the upstream registry URL
                * By default use the official registry URL: https://registry.modelcontextprotocol.io/v0.1/servers
                * Our frontend should provide a shortlist of other registry URLs such as: 
                * But also allow the end user to come with a custom upstream URL
            * This component must consume the upstream registry and display the search result as servers to install
            * Display the servers like the Browse MCP Servers
            * Instead of a "Configure" button we must have an "Install" button
            * The UI must be similar to Browse MCP Servers from "Add Source" BUT MUST ALSO have significant difference to avoid confusion. Come with ideas !
        * Manual setup
            * Ask the user for some inputs, in order to generate a valid server.json

LINKS
* Official MCP Registry
    * Repository: https://github.com/modelcontextprotocol/registry
    * server.json schema: https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/server.schema.json
    * openapi doc to browser upstream registries: https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/openapi.yaml
    * official MCP Registry api host: https://registry.modelcontextprotocol.io/v0.1/servers