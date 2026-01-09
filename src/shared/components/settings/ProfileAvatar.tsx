import React, { useRef, useState } from "react";
import { Camera, Loader2, Upload, Trash2 } from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import ToastUtils from "../../../utils/toastUtil";

interface ProfileAvatarProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  onAvatarChange: (url: string | null) => void;
  uploadEndpoint: string;
  readOnly?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  email,
  avatarUrl,
  onAvatarChange,
  uploadEndpoint,
  readOnly = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials =
    name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      ToastUtils.error("Please select an image file (PNG, JPG, SVG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      ToastUtils.error("Avatar must be smaller than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to upload avatar");
      }
      const nextUrl = data?.data?.avatar_url || data?.data?.setting?.value || null;
      onAvatarChange(nextUrl);
      ToastUtils.success("Profile picture updated");
    } catch (error: any) {
      console.error(error);
      ToastUtils.error(error.message || "Unable to upload profile picture right now.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      const response = await fetch(uploadEndpoint, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to remove avatar");
      }
      onAvatarChange(null);
      ToastUtils.success("Profile picture removed");
    } catch (error: any) {
      console.error(error);
      ToastUtils.error(error.message || "Unable to remove your profile picture right now.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModernCard className="flex flex-col gap-4 border border-slate-200/80 bg-white/90" padding="lg">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-2xl bg-slate-200">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name || "Profile avatar"}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-900/5 text-xl font-semibold text-slate-500">
              {initials}
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
          <label className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition hover:bg-primary-500">
            <Camera className="h-4 w-4" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {name || "Unknown administrator"}
            </h3>
            <p className="text-sm text-slate-500">{email || "No email set"}</p>
          </div>
          <p className="text-xs text-slate-400">
            Recommended size: 320 × 320px PNG, JPG, SVG (max 5MB)
          </p>
          <div className="flex flex-wrap gap-2">
            {!readOnly && (
              <ModernButton
                size="sm"
                className="flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                Upload new photo
              </ModernButton>
            )}
            {!readOnly && avatarUrl && (
              <ModernButton
                size="sm"
                variant="outline"
                className="flex items-center gap-2 text-red-500 hover:text-red-600"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </ModernButton>
            )}
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

export default ProfileAvatar;
