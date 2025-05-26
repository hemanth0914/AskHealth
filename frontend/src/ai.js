import Vapi from "@vapi-ai/web";

export const vapi = new Vapi(import.meta.env.VITE_VAPI_API_KEY);
const assistant = import.meta.env.VITE_VAPI_ASSISTANT_ID;


export const startAssistant = async (
    previousConversationHistory
  ) => {
    const assistantOverrides = {
      variableValues: {
        previousConversationHistory
      }
    };
    console.log("previousConversation", previousConversationHistory);
    console.log("Starting assistant with ID and overrides:", assistant, assistantOverrides);
  
    try {
      const response = await vapi.start(assistant, assistantOverrides);
      console.log("Raw response from vapi.start():", response);
  
      return response;
    } catch (err) {
      console.error("Error in vapi.start():", err);
      return null;
    }
  };
  

export const stopAssistant = () => {
    vapi.stop()
}


