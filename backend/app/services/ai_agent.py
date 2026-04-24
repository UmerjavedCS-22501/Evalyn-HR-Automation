import os
from typing import TypedDict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from typing import List, Optional

load_dotenv()

# Post length limit
MAX_CHARS = 2500

# 1. Define Agent State
class AgentState(TypedDict):
    title: str
    prompt: str
    generated_post: str
    structured_data: dict
    context: str
    error: str

# 1.5 Define Structured Model
class JobStructure(BaseModel):
    title: str = Field(description="The professional job title")
    department: str = Field(description="The department or team, e.g. Engineering, Marketing")
    location: str = Field(description="Location of the job, e.g. Remote, New York, Hybrid")
    type: str = Field(description="Job type: Full-time, Part-time, Contract, Internship")
    experience: str = Field(description="Required experience level, e.g. Mid-level, 5+ years")
    skills: List[str] = Field(description="List of required technical and soft skills")
    responsibilities: str = Field(description="Detailed job responsibilities and duties")
    qualifications: str = Field(description="Required education and certifications")
    min_salary: Optional[int] = Field(description="Minimum salary value as integer")
    max_salary: Optional[int] = Field(description="Maximum salary value as integer")
    currency: str = Field(description="Currency code, e.g. USD, PKR, EUR")
    period: str = Field(description="Salary period: Monthly, Yearly, Hourly")
    salary_note: Optional[str] = Field(description="Any additional notes about compensation")

# 2. Initialize LLM Factory
def get_model():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return ChatGroq(
        api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0.7
    )

# 3. Define the Node function
def generate_node(state: AgentState):
    title = state.get("title", "")
    context = state.get("context", "")
    model = get_model()
    
    if not model:
        return {"error": "GROQ_API_KEY not found in .env."}

    prompt = f"""
    You are an expert recruiter at "US Tech".
    
    Your task is to create a professional LinkedIn job post for the position: {title}
    
    COMPANY: US Tech
    LOCATION: Roshen Plaza 2nd floor
    
    INPUT CONTEXT:
    {context if context else "No additional details provided."}
    
    REQUIRED STRUCTURE:
    - Intro: A brief, professional introduction to the role at US Tech.
    - Job Details: Clearly state the Job Title and Location (Roshen Plaza 2nd floor).
    - Responsibilities: Use bullet points (•) for key duties.
    - Requirements: Use bullet points (•) for qualifications.
    - Call to Action: End with exactly "Apply now and take the next level."
    
    CONSTRAINTS:
    - EMOJIS: Use very limited emojis (max 1-2) or none.
    - WORD LIMIT: Total length MUST be between 150–200 words.
    - FORMATTING: Use standard bullet points (•). Do not use numbers for section headers; use clear bold-like text or just the header name.
    - FIDELITY: Only use information from the INPUT CONTEXT or the fixed details (US Tech, Roshen Plaza 2nd floor).

    OUTPUT:
    - Return ONLY the post text.
    """

    try:
        messages = [
            SystemMessage(content="You are an expert LinkedIn recruiter."),
            HumanMessage(content=prompt)
        ]
        response = model.invoke(messages)
        return {"generated_post": response.content}
    except Exception as e:
        return {"error": f"AI Error (Groq): {str(e)}"}

def extract_structure_node(state: AgentState):
    prompt_text = state.get("prompt", "")
    model = get_model()
    
    if not model:
        return {"error": "GROQ_API_KEY not found in .env."}

    # Use structured output if the model supports it, or manual prompting
    structured_llm = model.with_structured_output(JobStructure)
    
    system_prompt = """
    You are an expert HR Specialist. Extract structured job details from the provided natural language description.
    If a field is not explicitly mentioned, use your best professional judgement to fill it realistically based on the job title.
    """
    
    try:
        result = structured_llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt_text)
        ])
        return {"structured_data": result.dict()}
    except Exception as e:
        return {"error": f"Extraction Error: {str(e)}"}

# 4. Build the Graph
workflow = StateGraph(AgentState)

# Add node
workflow.add_node("generate", generate_node)

# Set entry point
workflow.set_entry_point("generate")

# Add edge to end
workflow.add_edge("generate", END)

# Compile the graph
agent_graph = workflow.compile()

# 5. Wrapper functions
def generate_job_post(title: str, context: str = ""):
    """
    Main entry point for generating job posts.
    """
    initial_state = {"title": title, "context": context, "generated_post": "", "error": ""}
    
    try:
        # We need a separate graph or dynamic dispatch for structured vs post
        # For now, let's just use the node directly or build a second graph
        result = generate_node(initial_state)
        
        if result.get("error"):
            return result["error"]
        
        return result.get("generated_post", "Error: No post generated.")
    except Exception as e:
        return f"Graph Error: {str(e)}"

def generate_structured_job(prompt: str):
    """
    Extracts structured job data from a prompt.
    """
    initial_state = {"prompt": prompt, "structured_data": {}, "error": ""}
    try:
        result = extract_structure_node(initial_state)
        if result.get("error"):
            return {"error": result["error"]}
        return result.get("structured_data")
    except Exception as e:
        return {"error": str(e)}