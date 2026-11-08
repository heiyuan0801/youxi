#import <UIKit/UIKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
static UIViewController *QingyePresenter(void) {
    UIWindow *window = UIApplication.sharedApplication.delegate.window;
    UIViewController *root = window.rootViewController;
    while (root.presentedViewController && !root.presentedViewController.isBeingDismissed) root = root.presentedViewController;
    return root;
}
@interface QingyeSaveImporter : NSObject <UIDocumentPickerDelegate>
+ (instancetype)shared;
- (BOOL)begin;
- (NSString *)take;
@end

@implementation QingyeSaveImporter {
    BOOL _waiting;
    NSString *_result;
}
+ (instancetype)shared {
    static QingyeSaveImporter *importer;
    static dispatch_once_t once;
    dispatch_once(&once, ^{ importer = [QingyeSaveImporter new]; });
    return importer;
}
- (BOOL)begin {
    @synchronized (self) {
        if (_waiting) return NO;
        _waiting = YES;
        _result = nil;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *presenter = QingyePresenter();
        if (!presenter || [presenter isKindOfClass:UIDocumentPickerViewController.class]) {
            [self finish:@"!error"];
            return;
        }
        UIDocumentPickerViewController *picker =
            [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:@[UTTypeJSON, UTTypePlainText] asCopy:YES];
        picker.delegate = self;
        [presenter presentViewController:picker animated:YES completion:nil];
    });
    return YES;
}
- (void)finish:(NSString *)value {
    @synchronized (self) { _result = value; }
}
- (NSString *)take {
    @synchronized (self) {
        if (!_result) return @"";
        NSString *result = _result;
        _result = nil;
        _waiting = NO;
        return result;
    }
}
- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
    [self finish:@"!cancel"];
}
- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls {
    NSURL *url = urls.firstObject;
    if (!url) { [self finish:@"!error"]; return; }
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        const NSUInteger limit = 8 * 1024 * 1024;
        NSFileHandle *file = [NSFileHandle fileHandleForReadingFromURL:url error:nil];
        NSMutableData *bytes = [NSMutableData data];
        NSString *value = nil;
        if (file) {
            while (bytes.length <= limit) {
                NSError *error = nil;
                NSData *chunk = [file readDataUpToLength:8192 error:&error];
                if (error) break;
                if (!chunk.length) {
                    value = [[NSString alloc] initWithData:bytes encoding:NSUTF8StringEncoding];
                    break;
                }
                [bytes appendData:chunk];
            }
            [file closeFile];
        }
        [self finish:value.length ? value : @"!error"];
    });
}
@end

@interface QingyeInvitePrompt : NSObject
+ (instancetype)shared;
- (BOOL)begin;
- (NSString *)take;
@end
@implementation QingyeInvitePrompt {
    BOOL _waiting;
    NSString *_result;
}
+ (instancetype)shared {
    static QingyeInvitePrompt *prompt;
    static dispatch_once_t once;
    dispatch_once(&once, ^{ prompt = [QingyeInvitePrompt new]; });
    return prompt;
}
- (BOOL)begin {
    @synchronized (self) {
        if (_waiting) return NO;
        _waiting = YES;
        _result = nil;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *root = QingyePresenter();
        if (!root) { [self finish:@"!error"]; return; }
        UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"朋友的邀请码"
            message:@"输入 8 位邀请码。只在本机兑换一份新手礼物，不会加入在线好友，也不会通知邀请人。"
            preferredStyle:UIAlertControllerStyleAlert];
        [alert addTextFieldWithConfigurationHandler:^(UITextField *field) {
            field.autocapitalizationType = UITextAutocapitalizationTypeAllCharacters;
            field.placeholder = @"邀请码";
        }];
        [alert addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:^(__unused UIAlertAction *action) {
            [self finish:@"!cancel"];
        }]];
        [alert addAction:[UIAlertAction actionWithTitle:@"兑换" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
            NSString *text = alert.textFields.firstObject.text ?: @"";
            [self finish:text.length ? text : @"!cancel"];
        }]];
        [root presentViewController:alert animated:YES completion:nil];
    });
    return YES;
}
- (void)finish:(NSString *)value { @synchronized (self) { _result = value; } }
- (NSString *)take {
    @synchronized (self) {
        if (!_result) return @"";
        NSString *result = _result;
        _result = nil;
        _waiting = NO;
        return result;
    }
}
@end

@interface QingyeBridge : NSObject
+ (NSString *)safeAreaJSON;
+ (void)haptic;
+ (BOOL)exportSave:(NSString *)json;
+ (BOOL)beginSaveImport;
+ (NSString *)takeSaveImport;
+ (BOOL)shareText:(NSString *)text imageSVG:(NSString *)svg;
+ (BOOL)beginInvitePrompt;
+ (NSString *)takeInvitePrompt;
@end
@implementation QingyeBridge
+ (BOOL)beginSaveImport { return [QingyeSaveImporter.shared begin]; }
+ (NSString *)takeSaveImport { return [QingyeSaveImporter.shared take]; }
+ (BOOL)beginInvitePrompt { return [QingyeInvitePrompt.shared begin]; }
+ (NSString *)takeInvitePrompt { return [QingyeInvitePrompt.shared take]; }
+ (BOOL)shareText:(NSString *)text imageSVG:(NSString *)svg {
    if (text.length == 0 || text.length > 4000 || svg.length > 200000) return NO;
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *root = QingyePresenter();
        if (!root) return;
        NSMutableArray *items = [NSMutableArray arrayWithObject:text];
        if (svg.length) {
            NSString *path = [NSTemporaryDirectory() stringByAppendingPathComponent:@"qingye-share.svg"];
            if ([svg writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:nil]) [items addObject:[NSURL fileURLWithPath:path]];
        }
        UIActivityViewController *sheet = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
        sheet.modalPresentationStyle = UIModalPresentationFormSheet;
        UIPopoverPresentationController *popover = sheet.popoverPresentationController;
        popover.sourceView = root.view;
        popover.sourceRect = CGRectMake(CGRectGetMidX(root.view.bounds), CGRectGetMidY(root.view.bounds), 1, 1);
        [root presentViewController:sheet animated:YES completion:nil];
    });
    return YES;
}
+ (NSString *)safeAreaJSON {
    __block NSString *result = @"{}";
    void (^read)(void) = ^{
        UIView *view = UIApplication.sharedApplication.delegate.window.rootViewController.view;
        CGSize size = view.bounds.size; UIEdgeInsets i = view.safeAreaInsets;
        if (size.width <= 0 || size.height <= 0) return;
        NSDictionary *value = @{@"left":@(i.left/size.width),@"right":@(i.right/size.width),@"top":@(i.top/size.height),@"bottom":@(i.bottom/size.height)};
        result = [[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:value options:0 error:nil] encoding:NSUTF8StringEncoding];
    };
    if (NSThread.isMainThread) read(); else dispatch_sync(dispatch_get_main_queue(), read);
    return result;
}
+ (void)haptic {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIImpactFeedbackGenerator *feedback = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
        [feedback prepare]; [feedback impactOccurred];
    });
}
+ (BOOL)exportSave:(NSString *)json {
    NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
    if (!data || data.length > 8*1024*1024 || ![[NSJSONSerialization JSONObjectWithData:data options:0 error:nil] isKindOfClass:NSDictionary.class]) return NO;
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *root = QingyePresenter(); if (!root || [root isKindOfClass:UIDocumentPickerViewController.class]) return;
        NSURL *folder = [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:@"QingyeSaveExport"] isDirectory:YES];
        NSError *error = nil;
        [[NSFileManager defaultManager] createDirectoryAtURL:folder withIntermediateDirectories:YES attributes:nil error:&error];
        NSURL *file = [folder URLByAppendingPathComponent:@"晴野物语-存档.json"];
        if (!error && [data writeToURL:file options:NSDataWritingAtomic error:&error]) {
            UIDocumentPickerViewController *picker = [[UIDocumentPickerViewController alloc] initForExportingURLs:@[file] asCopy:YES];
            picker.modalPresentationStyle = UIModalPresentationFormSheet;
            UIPopoverPresentationController *popover = picker.popoverPresentationController;
            popover.sourceView = root.view;
            popover.sourceRect = CGRectMake(CGRectGetMidX(root.view.bounds),CGRectGetMidY(root.view.bounds),1,1);
            [root presentViewController:picker animated:YES completion:nil];
        } else {
            UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"存档导出失败" message:@"请检查可用空间后重试。农场进度仍保存在本机。" preferredStyle:UIAlertControllerStyleAlert];
            [alert addAction:[UIAlertAction actionWithTitle:@"知道了" style:UIAlertActionStyleDefault handler:nil]];
            [root presentViewController:alert animated:YES completion:nil];
        }
    });
    return YES;
}
@end
