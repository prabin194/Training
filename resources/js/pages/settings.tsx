import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Loader2, Save, Key, User } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Profile form
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobileNo, setMobileNo] = useState(user?.mobile_no || "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setIsProfileSubmitting(true);

    try {
      await api.put("/profile", { name, email, mobile_no: mobileNo || null });
      setProfileSuccess(true);
      await refreshUser();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        setProfileError(
          e.response?.data?.errors?.email?.[0] ||
          e.response?.data?.message ||
          "Failed to update profile."
        );
      } else {
        setProfileError("Network error.");
      }
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== newPasswordConfirmation) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      await api.put("/password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string } } };
        setPasswordError(e.response?.data?.message || "Failed to change password.");
      } else {
        setPasswordError("Network error.");
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-2xl">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Full name</FieldLabel>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="settings-email">Email</FieldLabel>
                    <Input
                      id="settings-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="mobile">Mobile number</FieldLabel>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      placeholder="Optional"
                    />
                  </Field>
                  {profileError && <FieldError>{profileError}</FieldError>}
                  {profileSuccess && (
                    <p className="text-sm text-green-600 font-medium">Profile updated successfully.</p>
                  )}
                  <Button type="submit" disabled={isProfileSubmitting}>
                    {isProfileSubmitting ? (
                      <><Loader2 className="size-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="size-4" /> Save Changes</>
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="size-5" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="current_password">Current Password</FieldLabel>
                    <Input
                      id="current_password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new_password">New Password</FieldLabel>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <FieldDescription>
                      Must include uppercase, lowercase, and a number.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="new_password_confirmation">Confirm New Password</FieldLabel>
                    <Input
                      id="new_password_confirmation"
                      type="password"
                      value={newPasswordConfirmation}
                      onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                    />
                  </Field>
                  {passwordError && <FieldError>{passwordError}</FieldError>}
                  {passwordSuccess && (
                    <p className="text-sm text-green-600 font-medium">Password changed successfully.</p>
                  )}
                  <Button type="submit" disabled={isPasswordSubmitting}>
                    {isPasswordSubmitting ? (
                      <><Loader2 className="size-4 animate-spin" /> Changing...</>
                    ) : (
                      <><Key className="size-4" /> Change Password</>
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
