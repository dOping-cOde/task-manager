import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiSave, FiTarget, FiUpload, FiTrash2 } from "react-icons/fi";

import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from "../features/user/userSlice";
import { updateUser } from "../features/auth/authSlice";

const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

const Profile = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);
  const { profile, status } = useSelector((s) => s.user);

  const [form, setForm] = useState({
    name: "",
    avatar: "",
    bio: "",
    targetExam: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Fetch the freshest profile on mount.
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Prefill from the loaded profile, falling back to the auth user.
  useEffect(() => {
    const src = profile || authUser;
    if (src) {
      setForm({
        name: src.name || "",
        avatar: src.avatar || "",
        bio: src.bio || "",
        targetExam: src.targetExam || "",
      });
    }
  }, [profile, authUser]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    // Client-side validation (server enforces the same limits as well).
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPG, WEBP or GIF image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(
        `Image is ${(file.size / 1024 / 1024).toFixed(2)} MB — must be 1 MB or smaller`
      );
      return;
    }

    setUploading(true);
    const result = await dispatch(uploadAvatar(file));
    setUploading(false);
    if (uploadAvatar.fulfilled.match(result)) {
      setForm((prev) => ({ ...prev, avatar: result.payload.avatar }));
      dispatch(updateUser({ avatar: result.payload.avatar }));
      toast.success("Profile photo updated");
    } else {
      toast.error(result.payload || "Could not upload image");
    }
  };

  const handleAvatarRemove = async () => {
    setUploading(true);
    const result = await dispatch(removeAvatar());
    setUploading(false);
    if (removeAvatar.fulfilled.match(result)) {
      setForm((prev) => ({ ...prev, avatar: "" }));
      dispatch(updateUser({ avatar: "" }));
      toast.success("Photo removed");
    } else {
      toast.error(result.payload || "Could not remove image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await dispatch(updateProfile(form));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      // Sync the navbar/avatar in the auth slice.
      dispatch(
        updateUser({ name: result.payload.name, avatar: result.payload.avatar })
      );
      toast.success("Profile updated");
    } else {
      toast.error(result.payload || "Could not update profile");
    }
  };

  const email = profile?.email || authUser?.email || "";
  const initial = (form.name || email || "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage how you appear across CGLTracker.
        </p>
      </div>

      {/* Identity card */}
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        {form.avatar ? (
          <img
            src={form.avatar}
            alt={form.name}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-brand-100 dark:ring-slate-700"
          />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-brand-600 text-2xl font-extrabold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
            {form.name || "Your name"}
          </p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{email}</p>

          {/* Upload controls */}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleAvatarPick}
            className="hidden"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-primary px-4 py-2 text-sm"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <FiUpload />
              )}
              {form.avatar ? "Change photo" : "Upload photo"}
            </button>
            {form.avatar && (
              <button
                type="button"
                onClick={handleAvatarRemove}
                disabled={uploading}
                className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-slate-700"
              >
                <FiTrash2 /> Remove
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            PNG, JPG, WEBP or GIF · max 1 MB
          </p>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Full name
          </label>
          <div className="relative">
            <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your name"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email address
          </label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="input-field cursor-not-allowed pl-10 opacity-70"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Target exam
          </label>
          <div className="relative">
            <FiTarget className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="targetExam"
              value={form.targetExam}
              onChange={handleChange}
              placeholder="SSC CGL"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Bio
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            maxLength={300}
            placeholder="A short note about your prep goals…"
            className="input-field resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || status === "loading"}
          className="btn-primary"
        >
          {saving ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <>
              <FiSave /> Save changes
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Profile;