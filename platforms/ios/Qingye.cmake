# Project-local compatibility fixes; the shared Creator installation is untouched.
get_target_property(QINGYE_ENGINE_SOURCES ${ENGINE_NAME} SOURCES)
foreach(module System Screen SystemWindow AppDelegateBridge)
    if(module STREQUAL "AppDelegateBridge")
        set(original "${COCOS_X_PATH}/cocos/platform/ios/${module}.mm")
    else()
        set(original "${COCOS_X_PATH}/cocos/platform/ios/modules/${module}.mm")
    endif()
    file(READ "${original}" source)
    if(module STREQUAL "System")
        string(REPLACE "NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];\n    NSArray *languages = [defaults objectForKey:@\"AppleLanguages\"];" "NSArray *languages = [NSLocale preferredLanguages];" source "${source}")
    elseif(module STREQUAL "Screen")
        string(REPLACE "[[UIApplication sharedApplication] statusBarOrientation]" "UIApplication.sharedApplication.delegate.window.windowScene.interfaceOrientation" source "${source}")
        string(REPLACE "CC_ABORT();" "orientation = Orientation::LANDSCAPE_RIGHT;" source "${source}")
    else()
        string(REPLACE "[[UIScreen mainScreen] bounds]" "UIApplication.sharedApplication.delegate.window.bounds" source "${source}")
    endif()
    set(patched "${CMAKE_CURRENT_BINARY_DIR}/qingye-compat/${module}.mm")
    file(WRITE "${patched}" "${source}")
    list(REMOVE_ITEM QINGYE_ENGINE_SOURCES "${original}")
    list(APPEND QINGYE_ENGINE_SOURCES "${patched}")
endforeach()
set_property(TARGET ${ENGINE_NAME} PROPERTY SOURCES "${QINGYE_ENGINE_SOURCES}")

# Re-index the unchanged device objects for the modern Apple linker.
set(WEBP_REPACK_DIR "${CMAKE_CURRENT_BINARY_DIR}/webp-arm64")
file(MAKE_DIRECTORY "${WEBP_REPACK_DIR}")
execute_process(COMMAND xcrun lipo "${COCOS_X_PATH}/external/ios/libs/libwebp.a" -thin arm64 -output "${WEBP_REPACK_DIR}/original.a" COMMAND_ERROR_IS_FATAL ANY)
execute_process(COMMAND xcrun ar -x original.a WORKING_DIRECTORY "${WEBP_REPACK_DIR}" COMMAND_ERROR_IS_FATAL ANY)
file(GLOB WEBP_OBJECTS "${WEBP_REPACK_DIR}/*.o")
execute_process(COMMAND xcrun libtool -static ${WEBP_OBJECTS} -o "${CMAKE_CURRENT_BINARY_DIR}/libwebp-aligned.a" COMMAND_ERROR_IS_FATAL ANY)
set_target_properties(webp PROPERTIES IMPORTED_LOCATION "${CMAKE_CURRENT_BINARY_DIR}/libwebp-aligned.a")

set_target_properties(${EXECUTABLE_NAME} PROPERTIES
    OSX_ARCHITECTURES arm64
    XCODE_ATTRIBUTE_ARCHS arm64
    XCODE_ATTRIBUTE_ONLY_ACTIVE_ARCH NO
    XCODE_ATTRIBUTE_TARGETED_DEVICE_FAMILY "1,2"
    XCODE_ATTRIBUTE_CODE_SIGN_STYLE Automatic
    XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER com.qingyetales.farm
    XCODE_ATTRIBUTE_DEBUG_INFORMATION_FORMAT "dwarf-with-dsym"
    XCODE_ATTRIBUTE_GCC_GENERATE_DEBUGGING_SYMBOLS YES
    XCODE_ATTRIBUTE_ENABLE_BITCODE NO
)
set_target_properties(${ENGINE_NAME} PROPERTIES XCODE_ATTRIBUTE_GCC_GENERATE_DEBUGGING_SYMBOLS YES)
find_library(QINGYE_TYPES_FRAMEWORK UniformTypeIdentifiers REQUIRED)
target_link_libraries(${EXECUTABLE_NAME} ${QINGYE_TYPES_FRAMEWORK})
set_source_files_properties(AppDelegate.mm QingyeSceneDelegate.mm QingyeBridge.mm ViewController.mm PROPERTIES COMPILE_FLAGS "-fobjc-arc")
