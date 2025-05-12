import Vapi from "@vapi-ai/web";

export const vapi = new Vapi(import.meta.env.VITE_VAPI_API_KEY);
const assistant = import.meta.env.VITE_VAPI_ASSISTANT_ID;


export const startAssistant = async (
    motherAge,
    childAge,
    health_problems,
    vaccination_history,
    feedingConcerns,
    previousConversationHistory
  ) => {
    const assistantOverrides = {
      variableValues: {
        motherAge,
        childAge,
        health_problems,
        vaccination_history,
        feedingConcerns,
        previousConversationHistory
      }
    };
    console.log("previousConversation", previousConversationHistory);
    console.log("Starting assistant with ID and overrides:", assistant, assistantOverrides);
  
    return await vapi.start(assistant, assistantOverrides);
  };
  

export const stopAssistant = () => {
    vapi.stop()
}


