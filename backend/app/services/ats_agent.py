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
        
    return {"cv_text": cv_text[:10000]} # Limit text to prevent context overflow

# 4. Node to evaluate the ATS
def evaluate_ats_node(state: ATSAgentState):
    if state.get("error"):
        return state
        
    model = get_model()
    if not model:
        return {"error": "GROQ_API_KEY not found in .env."}

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Auditor. Your goal is to provide a highly professional, accurate, and unbiased evaluation of a candidate's fit for a specific role.

    CRITICAL RULES:
    1. Only credit skills if they are explicitly mentioned or clearly implied by experience in the CV text.
    2. Cross-reference the "Skills Submitted" by the candidate with the "CV Text". If a candidate claims a skill that is nowhere in the CV, verify if it's a realistic claim or a potential mismatch.
    3. Be strict on "Job Requirements". If a skill is "Required" in the JD, weight its absence heavily.

    INPUT DATA:
    - JOB DESCRIPTION: {state.get('job_description', '')}
    - SKILLS SUBMITTED BY CANDIDATE: {state.get('skills', '')}
    - EXPERIENCE SUMMARY: {state.get('experience', '')}
    - CV TEXT: {state.get('cv_text', '')}

    EVALUATION CRITERIA:
    1. Skill Match (50%): Comparing JD requirements vs (CV Text + Submitted Skills). Look for keyword matching and semantic similarity (e.g., "FastAPI" matches "Web Frameworks").
    2. Experience Fit (30%): Years of experience and seniority level match.
    3. Educational/Certification Fit (20%): Degree requirements and relevant certifications.

    OUTPUT FORMAT (STRICT JSON):
    {{
      "ats_score": 0, // 0-100
      "skill_match": "Percentage string",
      "experience_match": "Percentage string",
      "education_match": "Percentage string",
      "missing_skills": ["List specific missing keywords from JD"],
      "strengths": ["Identify 3-5 professional strengths based on CV evidence"],
      "weaknesses": ["Identify gaps or areas for clarification"],
      "recommendation": "Highly Suitable | Moderately Suitable | Not Suitable",
      "summary": "A 2-sentence professional summary of the candidate's profile."
    }}

    Return ONLY the JSON object.
    """

    try:
        messages = [
            SystemMessage(content="You are a professional Recruitment Auditor and ATS Specialist."),
            HumanMessage(content=prompt)
        ]
        response = model.invoke(messages)
        return {"ats_result": response.content}
    except Exception as e:
        return {"error": f"AI Error: {str(e)}"}

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
