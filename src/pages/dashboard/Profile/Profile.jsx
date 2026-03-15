import { useEffect, useRef, useState } from "react";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../../firebase";
import { useLanguage } from "../../../context/LanguageContext";
import "./Profile.css";

const text = {
  en: {
    title: "My Profile",
    subtitle: "Update your personal information",
    fullName: "Full Name",
    phone: "Phone Number",
    email: "Email",
    jobTitle: "Job Title",
    country: "Country",
    city: "City",
    bio: "About You",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Profile updated successfully",
    failedLoad: "Failed to load profile",
    failedSave: "Failed to save profile",
    changePhoto: "Change Photo",
    maxBio: "Max 300 characters",
    idLabel: "User ID",
    placeholderName: "Enter your full name",
    placeholderPhone: "Enter your phone number",
    placeholderJob: "Enter your job title",
    placeholderCountry: "Enter your country",
    placeholderCity: "Enter your city",
    placeholderBio: "Write a short bio...",
    emailReadOnly: "Email cannot be changed",
    changePassword: "Change Password",
    cancelPassword: "Cancel",
    oldPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    placeholderOldPassword: "Enter current password",
    placeholderNewPassword: "Enter new password",
    placeholderConfirmPassword: "Confirm new password",
    passwordMismatch: "New password and confirmation do not match",
    passwordShort: "New password must be at least 6 characters",
    passwordChanged: "Password changed successfully",
    passwordChangeFailed: "Failed to change password",
    passwordSaving: "Updating password...",
    passwordSave: "Update Password"
  },
  ar: {
    title: "ملفي الشخصي",
    subtitle: "حدث بياناتك الشخصية",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    jobTitle: "المهنة",
    country: "الدولة",
    city: "المدينة",
    bio: "نبذة عنك",
    save: "حفظ التعديلات",
    saving: "جار الحفظ...",
    saved: "تم تحديث البيانات بنجاح",
    failedLoad: "فشل تحميل بيانات الملف الشخصي",
    failedSave: "فشل حفظ بيانات الملف الشخصي",
    changePhoto: "تغيير الصورة",
    maxBio: "الحد الأقصى 300 حرف",
    idLabel: "معرف المستخدم",
    placeholderName: "اكتب اسمك الكامل",
    placeholderPhone: "اكتب رقم الهاتف",
    placeholderJob: "اكتب مهنتك",
    placeholderCountry: "اكتب الدولة",
    placeholderCity: "اكتب المدينة",
    placeholderBio: "اكتب نبذة قصيرة...",
    emailReadOnly: "لا يمكن تغيير البريد الإلكتروني",
    changePassword: "تغيير كلمة المرور",
    cancelPassword: "إلغاء",
    oldPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    placeholderOldPassword: "اكتب كلمة المرور الحالية",
    placeholderNewPassword: "اكتب كلمة المرور الجديدة",
    placeholderConfirmPassword: "أكد كلمة المرور الجديدة",
    passwordMismatch: "كلمة المرور الجديدة غير متطابقة مع التأكيد",
    passwordShort: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
    passwordChanged: "تم تغيير كلمة المرور بنجاح",
    passwordChangeFailed: "فشل تغيير كلمة المرور",
    passwordSaving: "جار تحديث كلمة المرور...",
    passwordSave: "تحديث كلمة المرور"
  }
};

const BIO_MAX = 300;

export default function Profile() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  const avatarInputRef = useRef(null);

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    jobTitle: "",
    country: "",
    city: "",
    bio: "",
    photoURL: ""
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUid("");
        setLoading(false);
        return;
      }

      setUid(user.uid);

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : {};

        setForm({
          name: data.name || user.displayName || "",
          phone: data.phone || user.phoneNumber || "",
          email: data.email || user.email || "",
          jobTitle: data.jobTitle || "",
          country: data.country || "",
          city: data.city || "",
          bio: data.bio || "",
          photoURL: data.photoURL || user.photoURL || ""
        });
      } catch (error) {
        console.error("Profile load error:", error);
        showToast(t.failedLoad, "error");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.clearTimeout(showToast.timeoutId);
    };
  }, [t.failedLoad]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleChangePassword = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      showToast(t.passwordChangeFailed, "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(t.passwordMismatch, "error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast(t.passwordShort, "error");
      return;
    }

    setPasswordSaving(true);

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.oldPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);

      resetPasswordForm();
      setShowPasswordForm(false);
      showToast(t.passwordChanged, "success");
    } catch (error) {
      console.error("Password change error:", error);
      showToast(t.passwordChangeFailed, "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSave = async () => {
    if (!uid) return;

    setSaving(true);
    try {
      let finalPhotoURL = form.photoURL;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const avatarRef = ref(storage, `users/${uid}/profile/avatar.${ext}`);
        await uploadBytes(avatarRef, avatarFile);
        finalPhotoURL = await getDownloadURL(avatarRef);
      }

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        jobTitle: form.jobTitle.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
        photoURL: finalPhotoURL,
        updatedAt: Date.now()
      };

      await setDoc(doc(db, "users", uid), payload, { merge: true });

      setForm((prev) => ({ ...prev, photoURL: finalPhotoURL }));
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview("");

      showToast(t.saved, "success");
    } catch (error) {
      console.error("Profile save error:", error);
      showToast(t.failedSave, "error");
    } finally {
      setSaving(false);
    }
  };

  const displayedAvatar = avatarPreview || form.photoURL;

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-container">
        {toast.message && (
          <div className={`tp-toast tp-toast--${toast.type}`}>{toast.message}</div>
        )}

        <div className="tp-card">
          <div className="tp-head">
            <div>
              <h1 className="tp-title">{t.title}</h1>
              <p className="tp-subtitle">{t.subtitle}</p>
            </div>
            <button className="tp-save" type="button" onClick={handleSave} disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
          </div>

          <div className="tp-profile-grid">
            <div className="tp-avatar-col">
              <div className="tp-avatar-wrap">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt="User avatar" className="tp-avatar" />
                ) : (
                  <div className="tp-avatar-placeholder">{form.name?.charAt(0) || "U"}</div>
                )}
              </div>

              <button
                type="button"
                className="tp-photo-btn"
                onClick={() => avatarInputRef.current?.click()}
              >
                {t.changePhoto}
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />

              <span className="tp-user-id">{t.idLabel}: {uid.slice(0, 8)}</span>
            </div>

            <div className="tp-fields">
              <div className="tp-row-2">
                <label className="tp-field">
                  <span>{t.fullName}</span>
                  <input
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder={t.placeholderName}
                  />
                </label>

                <label className="tp-field">
                  <span>{t.phone}</span>
                  <input
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder={t.placeholderPhone}
                  />
                </label>
              </div>

              <div className="tp-row-2">
                <label className="tp-field">
                  <span>{t.email}</span>
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    placeholder="example@email.com"
                  />
                  <small>{t.emailReadOnly}</small>
                </label>

                <label className="tp-field">
                  <span>{t.jobTitle}</span>
                  <input
                    value={form.jobTitle}
                    onChange={(e) => handleFieldChange("jobTitle", e.target.value)}
                    placeholder={t.placeholderJob}
                  />
                </label>
              </div>

              <div className="tp-row-2">
                <label className="tp-field">
                  <span>{t.country}</span>
                  <input
                    value={form.country}
                    onChange={(e) => handleFieldChange("country", e.target.value)}
                    placeholder={t.placeholderCountry}
                  />
                </label>

                <label className="tp-field">
                  <span>{t.city}</span>
                  <input
                    value={form.city}
                    onChange={(e) => handleFieldChange("city", e.target.value)}
                    placeholder={t.placeholderCity}
                  />
                </label>
              </div>

              <label className="tp-field">
                <span>{t.bio}</span>
                <textarea
                  maxLength={BIO_MAX}
                  value={form.bio}
                  onChange={(e) => handleFieldChange("bio", e.target.value)}
                  placeholder={t.placeholderBio}
                />
                <small>
                  {form.bio.length}/{BIO_MAX} - {t.maxBio}
                </small>
              </label>

              <div className="tp-password-card">
                <div className="tp-password-head">
                  <strong>{t.changePassword}</strong>
                  <button
                    type="button"
                    className="tp-password-toggle"
                    onClick={() => {
                      if (showPasswordForm) {
                        resetPasswordForm();
                      }
                      setShowPasswordForm((prev) => !prev);
                    }}
                  >
                    {showPasswordForm ? t.cancelPassword : t.changePassword}
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="tp-password-form">
                    <label className="tp-field">
                      <span>{t.oldPassword}</span>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(e) => handlePasswordFieldChange("oldPassword", e.target.value)}
                        placeholder={t.placeholderOldPassword}
                      />
                    </label>

                    <div className="tp-row-2">
                      <label className="tp-field">
                        <span>{t.newPassword}</span>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => handlePasswordFieldChange("newPassword", e.target.value)}
                          placeholder={t.placeholderNewPassword}
                        />
                      </label>

                      <label className="tp-field">
                        <span>{t.confirmPassword}</span>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => handlePasswordFieldChange("confirmPassword", e.target.value)}
                          placeholder={t.placeholderConfirmPassword}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="tp-password-save"
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? t.passwordSaving : t.passwordSave}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
