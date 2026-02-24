"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";
import { getCurrentUser, updateProfileAction, changePasswordAction, logoutAction } from "@/app/actions/auth";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "admin";
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      const current = await getCurrentUser();
      setUser(current);
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Not signed in</h1>
          <p className="text-slate-400 mt-2">Please sign in to view your profile.</p>
          <Link
            href="/login"
            className="inline-flex mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const onUpdateProfile = async (formData: FormData) => {
    const result = await updateProfileAction(formData);
    setProfileMessage(result.message);
    const current = await getCurrentUser();
    setUser(current);
  };

  const onChangePassword = async (formData: FormData) => {
    const result = await changePasswordAction(formData);
    setPasswordMessage(result.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => logoutAction()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
          >
            Log out
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
              <p className="text-slate-400 text-sm mt-1">{user.email}</p>
            </div>
            <span className="text-xs uppercase tracking-wide bg-slate-800 text-slate-200 px-2 py-1 rounded">
              {user.role.replace("_", " ")}
            </span>
          </div>
          {user.role === "super_admin" && (
            <div className="mt-4">
              <Link
                href="/super-admin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Add Admin
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white">Profile Details</h2>
            <form action={onUpdateProfile} className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              {profileMessage && (
                <div className="text-sm text-slate-300">{profileMessage}</div>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white">Security</h2>
            <form action={onChangePassword} className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Current Password</label>
                <input
                  name="currentPassword"
                  type="password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              {passwordMessage && (
                <div className="text-sm text-slate-300">{passwordMessage}</div>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
