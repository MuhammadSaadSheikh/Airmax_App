package com.airmax

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class AirmaxEnvironmentModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "AirmaxEnvironment"

  override fun getConstants(): Map<String, Any> = mapOf(
    "environment" to BuildConfig.AIRMAX_ENV,
  )
}
