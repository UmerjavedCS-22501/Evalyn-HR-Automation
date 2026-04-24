import os
import json
import fitz  # PyMuPDF
from typing import TypedDict, Dict, Any
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

# 1. Define Agent State
class ATSAgentState(TypedDict):
    job_description: str
    cv_path: str
    skills: str
    experience: str
    cover_letter: str
    cv_text: str
    ats_result: str
    error: str

# 2. Initialize LLM Factory
def get_model():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return ChatGroq(
        api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0.2, # Low temp for structured, analytical output
        model_kwargs={"response_format": {"type": "json_object"}}
    )

# 3. Node to parse the CV
def parse_cv_node(state: ATSAgentState):
    cv_path = state.get("cv_path", "")
    if not os.path.exists(cv_path):
        return {"error": f"CV file not found at {cv_path}"}
    
    cv_text = ""
    try:
        if cv_path.lower().endswith(".pdf"):
            doc = fitz.open(cv_path)
            for page in doc:
                cv_text += page.get_text() + "\n"
        else:
            # Fallback for simple text files or unhandled formats
            with open(cv_path, "r", encoding="utf-8", errors="ignore") as f:
                cv_text = f.read()
    except Exception as e:
        return {"error": f"Failed to parse CV: {str(e)}"}
        
    return {"cv_text": cv_text[:5000]} # Limit text to prevent context overflow

# 4. Node to evaluate the ATS
def evaluate_ats_node(state: ATSAgentState):
    if state.get("error"):
        return state
        
    model = get_model()
    if not model:
        return {"error": "GROQ_API_KEY not found in .env."}

    prompt = f"""
    You are an expert ATS AI evaluating a candidate against a job description.
    
    JOB DESCRIPTION:
    {state.get('job_description', '')}
    
    CANDIDATE DETAILS:
    - Skills Submitted: {state.get('skills', '')}
    - Experience Submitted: {state.get('experience', '')}
    - Cover Letter: {state.get('cover_letter', '')}
    
    CANDIDATE CV TEXT:
    {state.get('cv_text', '')}
    
    Your task is to analyze the candidate's fit for the job and return the analysis strictly as a valid JSON object.
    
    JSON SCHEMA REQUIRED:
    {{
      "ats_score": 0, // Integer 0-100 (Skills 50%, Experience 30%, Education 20%)
      "skill_match": "Percentage string like '85%'",
      "experience_match": "Percentage string like '90%'",
      "education_match": "Percentage string like '100%'",
      "missing_skills": ["Skill 1", "Skill 2"],
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "recommendation": "Highly Suitable | Moderately Suitable | Not Suitable"
    }}
    
    Ensure your output is ONLY the raw JSON object and nothing else.
    """

    try:
        messages = [
            SystemMessage(content="You are an expert ATS (Applicant Tracking System) AI."),
            HumanMessage(content=prompt)
        ]
        response = model.invoke(messages)
        
        # Parse JSON to validate, then stringify back for state (or keep as string if desired)
        result_json_str = response.content
        return {"ats_result": result_json_str}
    except Exception as e:
        return {"error": f"AI Error (Groq): {str(e)}"}

# 5. Build the Graph
workflow = StateGraph(ATSAgentState)
workflow.add_node("parse_cv", parse_cv_node)
workflow.add_node("evaluate_ats", evaluate_ats_node)

workflow.set_entry_point("parse_cv")
workflow.add_edge("parse_cv", "evaluate_ats")
workflow.add_edge("evaluate_ats", END)

ats_graph = workflow.compile()

# 6. Wrapper function to be called from the route
def run_ats_evaluation(job_description: str, cv_path: str, skills: str, experience: str, cover_letter: str) -> Dict[str, Any]:
    initial_state = {
        "job_description": job_description,
        "cv_path": cv_path,
        "skills": skills,
        "experience": experience,
        "cover_letter": cover_letter,
        "cv_text": "",
        "ats_result": "",
        "error": ""
    }
    
    try:
        result = ats_graph.invoke(initial_state)
        
        if result.get("error"):
            return {"error": result["error"]}
            
        try:
            parsed_json = json.loads(result["ats_result"])
            return parsed_json
        except json.JSONDecodeError:
             return {"error": "Failed to parse LLM output as JSON."}
             
    except Exception as e:
        return {"error": f"Graph Error: {str(e)}"}
