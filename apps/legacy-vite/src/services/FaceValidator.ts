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
        message = "Center your face in the frame.";
        break;
      case 4:
      case 1004:
        message = "Move farther or closer. Face size is out of range.";
        break;
      case 5:
      case 1005:
        message = "Increase lighting. It's too dark.";
        break;
      case 6:
      case 1006:
        message = "Decrease lighting. It's too bright.";
        break;
      case 7:
      case 1007:
        message = "Move back so your upper chest is visible.";
        break;
      case 10:
        message = "Camera is tuning, please wait...";
        break;
      case 11:
        message = "Frame rate too low. Ensure good lighting.";
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
