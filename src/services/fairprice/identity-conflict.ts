import type { AttributedValue } from "./schemas";

function norm(s?: string | null): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * If image and user disagree on model family, do not silently pick one.
 */
export function detectIdentityConflict(input: {
  userBrand?: string | null;
  userModel?: string | null;
  visionBrand?: AttributedValue;
  visionModel?: AttributedValue;
}): { conflict: boolean; message: string | null } {
  const userBrand = norm(input.userBrand);
  const userModel = norm(input.userModel);
  const visionBrand =
    input.visionBrand?.value != null ? norm(String(input.visionBrand.value)) : "";
  const visionModel =
    input.visionModel?.value != null ? norm(String(input.visionModel.value)) : "";

  if (!userModel || !visionModel) {
    return { conflict: false, message: null };
  }

  // Require reasonably confident vision
  if ((input.visionModel?.confidence ?? 0) < 0.55) {
    return { conflict: false, message: null };
  }

  const markers = ["pro", "plus", "max", "ultra", "mini", "air"];
  let markerConflict = false;
  for (const m of markers) {
    const u = userModel.includes(m);
    const v = visionModel.includes(m);
    if (u !== v) markerConflict = true;
  }

  const modelMismatch =
    !userModel.includes(visionModel) &&
    !visionModel.includes(userModel) &&
    userModel !== visionModel;

  const brandMismatch =
    Boolean(userBrand && visionBrand) &&
    userBrand !== visionBrand &&
    (input.visionBrand?.confidence ?? 0) >= 0.7;

  if (brandMismatch || markerConflict || modelMismatch) {
    return {
      conflict: true,
      message: `Image suggests ${input.visionBrand?.value ?? ""} ${input.visionModel?.value ?? ""}, but you entered ${input.userBrand ?? ""} ${input.userModel ?? ""}. Please confirm the exact model.`,
    };
  }

  return { conflict: false, message: null };
}
