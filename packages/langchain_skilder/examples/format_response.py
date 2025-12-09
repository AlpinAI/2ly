from datetime import datetime

def format_agent_response(response, user_question, model_name):
    """Format agent response for beautiful CLI output"""
    
    # ANSI color codes
    BLUE = '\033[94m'
    RED = '\033[91m'
    PURPLE = '\033[95m'
    DARK_GREY = '\033[90m'
    BOLD = '\033[1m'
    RESET = '\033[0m'
    
    # Extract the final AI response
    messages = response.get('messages', [])
    final_answer = None
    token_usage = None
    tool_calls_count = 0
    
    # Find the last message with content (final agent response)
    for message in reversed(messages):
        if hasattr(message, 'content') and message.content and final_answer is None:
            final_answer = message.content
            break
    
    # Count tool calls and get usage metadata
    for message in messages:
        if hasattr(message, 'tool_calls') and message.tool_calls:
            tool_calls_count += len(message.tool_calls)
        if hasattr(message, 'usage_metadata'):
            token_usage = message.usage_metadata
    
    # Print header
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BOLD}{BLUE}  🤖 Skilder Agent Response{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    
    # Print timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"{PURPLE}📅 Timestamp:{RESET} {timestamp}")
    print(f"{PURPLE}🔧 Model:{RESET} {model_name}")
    
    # Print user question
    print(f"\n{BOLD}{BLUE}❓ Question:{RESET}")
    print(f"{DARK_GREY}   {user_question}{RESET}")
    
    # Print agent answer
    print(f"\n{BOLD}{BLUE}💬 Answer:{RESET}")
    if final_answer:
        # Word wrap for better readability
        lines = final_answer.split('\n')
        for line in lines:
            if line.strip():
                print(f"{DARK_GREY}   {line.strip()}{RESET}")
            else:
                print()
    else:
        print(f"{RED}   No response found{RESET}")
    
    # Print metadata
    print(f"\n{BOLD}{BLUE}📊 Metadata:{RESET}")
    if token_usage:
        print(f"{PURPLE}   • Input tokens:{RESET} {token_usage.get('input_tokens', 'N/A')}")
        print(f"{PURPLE}   • Output tokens:{RESET} {token_usage.get('output_tokens', 'N/A')}")
        print(f"{PURPLE}   • Total tokens:{RESET} {token_usage.get('total_tokens', 'N/A')}")
    
    if tool_calls_count > 0:
        print(f"{PURPLE}   • Tool calls made:{RESET} {tool_calls_count}")
    
    print(f"{PURPLE}   • Total messages:{RESET} {len(messages)}")
    
    print(f"{BLUE}{'='*80}{RESET}\n")