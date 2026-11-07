#import <UIKit/UIKit.h>
#import "platform/ios/AppDelegateBridge.h"
@class ViewController;
@interface AppDelegate : NSObject <UIApplicationDelegate>
@property(nonatomic,strong) UIWindow *window;
@property(nonatomic,strong,readonly) ViewController *viewController;
@property(nonatomic,strong,readonly) AppDelegateBridge *appDelegateBridge;
@property(nonatomic,readonly) BOOL engineReady;
- (void)attachWindowScene:(UIWindowScene *)scene;
@end
