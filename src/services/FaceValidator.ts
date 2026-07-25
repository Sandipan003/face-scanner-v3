export type ValidationStatus = {
  isValid: boolean;
  message: string;
  code: number;
};

export class FaceValidator {
  private lastValidationCode: number = -1;

  public processServerValidation(code: number, hint: string): ValidationStatus {
    this.lastValidationCode = code;
    
    let message = hint;
    let isValid = false;

    switch (code) {
      case 0: // Success / Valid
        message = "Perfect! Hold still.";
        isValid = true;
        break;
      case 1:
      case 1001:
        message = "No face detected. Please look at the camera.";
        break;
      case 2:
      case 1002:
        message = "Multiple faces detected. Please ensure only you are in frame.";
        break;
      case 3:
      case 1003:
        message = "Move closer to the camera.";
        break;
      case 4:
      case 1004:
        message = "Move farther from the camera.";
        break;
      case 5:
      case 1005:
        message = "Increase lighting. It's too dark.";
        break;
      case 6:
      case 1006:
        message = "Hold still. Too much movement detected.";
        break;
      case 7:
      case 1007:
        message = "Center your face in the frame.";
        break;
      default:
        message = hint || "Adjusting camera and analyzing...";
        break;
    }

    return { isValid, message, code };
  }

  public reset() {
    this.lastValidationCode = -1;
  }
}
