import { create } from 'zustand';
import { fullTryOnFlow } from "../lib/segmind";

export const useTryOnStore = create((set, get) => ({
  modelFile: null,
  upperwearFile: null,
  bottomwearFile: null,
  modelPreview: null,
  upperwearPreview: null,
  bottomwearPreview: null,
  upperwearDesc: "",
  bottomwearDesc: "",
  
  result: null,
  loading: false,
  error: "",
  step: 1,
  showComparison: false,
  loadingStepIndex: 0,
  abortController: null,
  
  setModelFile: (file, preview) => set({ modelFile: file, modelPreview: preview, step: 2, error: "" }),
  setUpperwearFile: (file, preview) => set({ upperwearFile: file, upperwearPreview: preview, error: "" }),
  setBottomwearFile: (file, preview) => set({ bottomwearFile: file, bottomwearPreview: preview, error: "" }),
  
  setUpperwearDesc: (desc) => set({ upperwearDesc: desc }),
  setBottomwearDesc: (desc) => set({ bottomwearDesc: desc }),
  
  setShowComparison: (show) => set({ showComparison: show }),
  setLoadingStepIndex: (index) => set({ loadingStepIndex: index }),
  setError: (err) => set({ error: err }),
  cancelTryOn: () => {
    const state = get();
    if (state.abortController) {
      state.abortController.abort();
    }
    set({ loading: false, error: "", abortController: null, step: state.result ? 3 : 2 });
  },
  
  handleTryOn: async () => {
    const state = get();
    if (!state.modelFile) {
      set({ error: "Please upload your photo." });
      return;
    }
    if (!state.upperwearFile && !state.bottomwearFile) {
      set({ error: "Please upload at least one garment (upperwear or bottomwear)." });
      return;
    }

    const controller = new AbortController();
    set({ loading: true, step: 3, error: "", result: null, abortController: controller });

    try {
      let currentModelFile = state.modelFile;
      let finalResultUrl = null;

      if (state.upperwearFile) {
        set({ loadingStepIndex: 0 });
        const desc = state.upperwearDesc.trim() ? `Upperwear: ${state.upperwearDesc}` : "Upperwear";
        const { resultUrl } = await fullTryOnFlow(currentModelFile, state.upperwearFile, desc, controller.signal);
        if (!resultUrl) throw new Error("Failed to process upperwear.");
        finalResultUrl = resultUrl;
        
        if (state.bottomwearFile) {
          const res = await fetch(resultUrl);
          const blob = await res.blob();
          currentModelFile = new File([blob], "temp_model.png", { type: blob.type });
        }
      }

      if (state.bottomwearFile) {
        set({ loadingStepIndex: 2 });
        const desc = state.bottomwearDesc.trim() ? `Bottomwear: ${state.bottomwearDesc}` : "Bottomwear";
        const { resultUrl } = await fullTryOnFlow(currentModelFile, state.bottomwearFile, desc, controller.signal);
        if (!resultUrl) throw new Error("Failed to process bottomwear.");
        finalResultUrl = resultUrl;
      }

      set({ result: finalResultUrl });
    } catch (err) {
      if (err.name === "AbortError" || err.message.includes("aborted")) {
        console.log("Try-on generation cancelled.");
      } else {
        set({ error: err.message || "AI processing failed. Please try again." });
      }
    } finally {
      // Only set loading false if we haven't already cancelled (in which case loading is already false)
      const currentState = get();
      if (currentState.abortController === controller) {
        set({ loading: false, abortController: null });
      }
    }
  },
  
  reset: () => set({
    modelFile: null,
    upperwearFile: null,
    bottomwearFile: null,
    modelPreview: null,
    upperwearPreview: null,
    bottomwearPreview: null,
    upperwearDesc: "",
    bottomwearDesc: "",
    result: null,
    loading: false,
    error: "",
    step: 1,
    showComparison: false,
    loadingStepIndex: 0,
  })
}));
