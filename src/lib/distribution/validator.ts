// ═══════════════════════════════════════════════════════════════
// PLAN VALIDATOR — Lightweight schema-aware validation
// No external deps (Cloudflare Worker compatible).
// Mirrors schemas/distribution-plan.schema.json
// ═══════════════════════════════════════════════════════════════

import type { DistributionPlan } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePlan(plan: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Plan must be a JSON object.'], warnings };
  }

  // Required top-level fields
  if (!plan.plan_id || typeof plan.plan_id !== 'string') {
    errors.push('plan_id is required and must be a string.');
  } else if (!/^[a-zA-Z0-9_\-]+$/.test(plan.plan_id)) {
    errors.push('plan_id must match pattern ^[a-zA-Z0-9_\\-]+$');
  }

  if (plan.version !== '1.0.0') {
    errors.push(`Unsupported plan version "${plan.version}". Expected "1.0.0".`);
  }

  // Asset package
  const ap = plan.asset_package;
  if (!ap || typeof ap !== 'object') {
    errors.push('asset_package is required.');
  } else {
    if (!ap.title || typeof ap.title !== 'string') {
      errors.push('asset_package.title is required.');
    } else if (ap.title.length < 3 || ap.title.length > 200) {
      errors.push('asset_package.title must be 3-200 chars.');
    }
    if (!ap.primary_image || typeof ap.primary_image !== 'object') {
      errors.push('asset_package.primary_image is required.');
    } else if (!ap.primary_image.source) {
      errors.push('asset_package.primary_image.source is required.');
    }
  }

  // Platform routes
  const pr = plan.platform_routes;
  if (!pr || typeof pr !== 'object') {
    errors.push('platform_routes is required.');
  } else {
    const enabledCount = ['pinterest', 'imgur', 'tumblr'].filter(
      (k) => pr[k] && pr[k].enabled !== false
    ).length;
    if (enabledCount === 0) {
      errors.push('At least one enabled platform route is required.');
    }

    if (pr.pinterest && pr.pinterest.enabled !== false) {
      if (!pr.pinterest.board_id) {
        errors.push('platform_routes.pinterest.board_id is required when Pinterest is enabled.');
      }
      if (pr.pinterest.pin_title && pr.pinterest.pin_title.length > 100) {
        errors.push('Pinterest pin_title max 100 chars.');
      }
      if (pr.pinterest.pin_description && pr.pinterest.pin_description.length > 800) {
        errors.push('Pinterest pin_description max 800 chars.');
      }
    }

    if (pr.tumblr && pr.tumblr.enabled !== false) {
      if (!pr.tumblr.blog_name) {
        errors.push('platform_routes.tumblr.blog_name is required when Tumblr is enabled.');
      }
      if (pr.tumblr.tags && Array.isArray(pr.tumblr.tags)) {
        if (pr.tumblr.tags.length > 30) {
          warnings.push('Tumblr supports max 30 tags — extras will be truncated.');
        }
        for (const tag of pr.tumblr.tags) {
          if (typeof tag !== 'string' || tag.length > 139) {
            errors.push(`Invalid Tumblr tag: ${tag}`);
          }
        }
      }
    }

    if (pr.imgur && pr.imgur.enabled !== false) {
      if (pr.imgur.privacy && !['public', 'hidden', 'secret'].includes(pr.imgur.privacy)) {
        errors.push('Invalid Imgur privacy value.');
      }
    }
  }

  // Execution mode
  if (plan.execution_mode && !['dry_run', 'live', 'queue'].includes(plan.execution_mode)) {
    errors.push('Invalid execution_mode.');
  }

  // Interlinking warnings
  const il = plan.interlinking_logic;
  if (il) {
    if ((il.use_imgur_url_for_pinterest || il.use_imgur_url_for_tumblr) &&
        (!pr?.imgur || pr.imgur.enabled === false)) {
      errors.push('interlinking_logic references Imgur URL but Imgur platform is not enabled.');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function normalizePlan(plan: DistributionPlan): DistributionPlan {
  // Apply schema defaults
  const normalized: DistributionPlan = {
    ...plan,
    created_at: plan.created_at || new Date().toISOString(),
    execution_mode: plan.execution_mode || 'live',
    execution_order: plan.execution_order || ['imgur', 'pinterest', 'tumblr'],
    retry_policy: {
      max_attempts: 3,
      backoff_ms: 2000,
      fail_fast: false,
      ...(plan.retry_policy || {}),
    },
    interlinking_logic: {
      primary_host: 'imgur',
      use_imgur_url_for_pinterest: false,
      use_imgur_url_for_tumblr: false,
      cross_reference_in_descriptions: false,
      ...(plan.interlinking_logic || {}),
    },
  };
  return normalized;
}
