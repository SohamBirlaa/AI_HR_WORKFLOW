"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { Mail, Lock, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Session redirect: If the recruiter is already logged in, redirect straight to the dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  // Handle form submission: post to backend and save token on success
  const onSubmit = async (data: LoginFields) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // POST login details to the FastAPI auth login router
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });
      
      // If server returns token, save it via the context login function and route to dashboard
      if (response.data?.access_token) {
        login(response.data.access_token);
        router.push("/dashboard");
      } else {
        setErrorMsg("Failed to authenticate. No token returned.");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      // Map API status codes and details to user-facing error messages
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMsg("Incorrect email or password.");
      } else if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Something went wrong. Please check if the backend is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
            AI HR Platform
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your recruiter dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-md bg-rose-50 p-4 border border-rose-200">
            <p className="text-sm font-medium text-rose-800">{errorMsg}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-500 text-sm ${
                    errors.email ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""
                  }`}
                  placeholder="recruiter@company.com"
                  {...register("email")}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`block w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-500 text-sm ${
                    errors.password ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""
                  }`}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:bg-slate-400 cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
