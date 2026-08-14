'use client';

import { useActionState } from 'react';
import { updateSocialSettings } from '@/app/admin/(shell)/posts-sociaux/actions';
import type { SocialSettings } from '@/lib/social-settings';
import type { FormActionState } from '@/components/admin/FormShell';

export function SocialSettingsForm({ initial }: { initial: SocialSettings }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateSocialSettings,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-[14px] p-5"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198, 198, 200, 0.5)' }}
    >
      <label className="flex flex-col gap-1.5 text-body-sm" style={{ color: 'var(--text)' }}>
        <span className="font-medium">Hashtags par défaut (Instagram)</span>
        <input
          type="text"
          name="defaultHashtags"
          defaultValue={initial.defaultHashtags}
          placeholder="#CarPerformance #Guadeloupe #971"
          className="rounded-[10px] px-3 py-2 border"
          style={{ borderColor: 'rgba(198, 198, 200, 0.8)', background: '#F5F5F7' }}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-body-sm" style={{ color: 'var(--text)' }}>
        <span className="font-medium">Signature de fin de post</span>
        <input
          type="text"
          name="signature"
          defaultValue={initial.signature}
          placeholder="Car Performance · Guadeloupe"
          className="rounded-[10px] px-3 py-2 border"
          style={{ borderColor: 'rgba(198, 198, 200, 0.8)', background: '#F5F5F7' }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[10px] px-4 py-2 text-body-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {state?.ok && (
        <p role="status" style={{ color: 'var(--green)' }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
