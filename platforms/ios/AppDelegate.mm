#import "AppDelegate.h"
#import "ViewController.h"
#import "View.h"
#import "QingyeSceneDelegate.h"
#import "service/SDKWrapper.h"
#import <AVFAudio/AVFAudio.h>
@implementation AppDelegate {
    NSDictionary *_launchOptions;
}
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options {
    _launchOptions = [options copy];
    _appDelegateBridge = [[AppDelegateBridge alloc] init];
    [[SDKWrapper shared] application:application didFinishLaunchingWithOptions:options];
    // Respect the silent switch and coexist with music from other apps.
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];
    return YES;
}
- (UISceneConfiguration *)application:(UIApplication *)application configurationForConnectingSceneSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    UISceneConfiguration *config = [[UISceneConfiguration alloc] initWithName:@"Farm" sessionRole:session.role];
    config.delegateClass = QingyeSceneDelegate.class;
    return config;
}
- (void)attachWindowScene:(UIWindowScene *)scene {
    if (self.window) return; // A single farm, one engine instance and one save writer.
    self.window = [[UIWindow alloc] initWithWindowScene:scene];
    _viewController = [[ViewController alloc] init];
    _viewController.view = [[View alloc] initWithFrame:scene.coordinateSpace.bounds];
    _viewController.view.contentScaleFactor = scene.screen.scale;
    _viewController.view.multipleTouchEnabled = YES;
    self.window.rootViewController = _viewController;
    [self.window makeKeyAndVisible];
    [self.appDelegateBridge application:UIApplication.sharedApplication didFinishLaunchingWithOptions:_launchOptions];
    _engineReady = YES;
    [_viewController.view setNeedsLayout];
}
- (void)applicationWillTerminate:(UIApplication *)application {
    if (self.engineReady) [self.appDelegateBridge applicationWillTerminate:application];
    [[SDKWrapper shared] applicationWillTerminate:application];
}
- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    if (self.engineReady) [self.appDelegateBridge applicationDidReceiveMemoryWarning:application];
}
@end
