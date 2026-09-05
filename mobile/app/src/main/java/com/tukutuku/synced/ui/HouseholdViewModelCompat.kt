package com.tukutuku.synced.ui

import com.tukutuku.synced.app.HouseholdViewModel
import com.tukutuku.synced.data.model.RedeemInviteResult

// Premium Shared UI used the earlier `join` name. Keep the UI contract while
// routing through the hardened modern invite redemption flow.
fun HouseholdViewModel.join(
    code: String,
    done: (Result<RedeemInviteResult>) -> Unit,
) = joinInvite(code, done)
