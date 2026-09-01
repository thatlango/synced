package com.tukutuku.synced.data.session

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.tukutuku.synced.core.SecureCipher
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionStore @Inject constructor(private val dataStore: DataStore<Preferences>) {
    companion object { private val TOKEN=stringPreferencesKey("synced_access_token_v1"); private val USER=stringPreferencesKey("synced_user_id_v1"); private val EMAIL=stringPreferencesKey("synced_user_email_v1"); private val NAME=stringPreferencesKey("synced_user_name_v1"); private val WALLET=stringPreferencesKey("synced_wallet_id_v1"); private val SMS_LAST=stringPreferencesKey("synced_sms_last_timestamp_v1"); private val SSO_STATE=stringPreferencesKey("synced_sso_state_v1"); private val SSO_VERIFIER=stringPreferencesKey("synced_sso_verifier_v1") }
    suspend fun token(): String? = dataStore.data.first()[TOKEN]?.let(SecureCipher::decrypt)
    suspend fun save(token: String, userId: String, email: String?, name: String?) = dataStore.edit { p -> p[TOKEN]=SecureCipher.encrypt(token); p[USER]=userId; email?.let{p[EMAIL]=it}; name?.let{p[NAME]=it} }
    suspend fun clear() = dataStore.edit { p -> p.remove(TOKEN); p.remove(USER); p.remove(EMAIL); p.remove(NAME); p.remove(WALLET); p.remove(SSO_STATE); p.remove(SSO_VERIFIER) }
    suspend fun savePendingSso(state: String, verifier: String) = dataStore.edit { p -> p[SSO_STATE]=SecureCipher.encrypt(state); p[SSO_VERIFIER]=SecureCipher.encrypt(verifier) }
    suspend fun pendingSso(): Pair<String, String>? { val p=dataStore.data.first(); val state=p[SSO_STATE]?.let(SecureCipher::decrypt); val verifier=p[SSO_VERIFIER]?.let(SecureCipher::decrypt); return if(state.isNullOrBlank() || verifier.isNullOrBlank()) null else state to verifier }
    suspend fun clearPendingSso() = dataStore.edit { p -> p.remove(SSO_STATE); p.remove(SSO_VERIFIER) }
    suspend fun setWallet(id: String) = dataStore.edit { it[WALLET]=id }
    suspend fun wallet(): String? = dataStore.data.first()[WALLET]
    suspend fun smsLastTimestamp(): Long = dataStore.data.first()[SMS_LAST]?.toLongOrNull() ?: 0L
    suspend fun setSmsLastTimestamp(value: Long) = dataStore.edit { it[SMS_LAST]=value.toString() }
}
