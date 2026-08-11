// ===== Translation types =====
export type Language = 'vi' | 'en'

export interface TranslationKey {
  nav: {
    home: string
    keywords: string
    trending: string
    videos: string
    profile: string
  }
  common: {
    save: string
    cancel: string
    delete: string
    edit: string
    add: string
    confirm: string
    loading: string
    search: string
    noData: string
    success: string
    error: string
    retry: string
    yes: string
    no: string
    select: string
    all: string
    total: string
    justNow: string
    minutesAgo: string
    hoursAgo: string
    daysAgo: string
    offlineMode: string
    saveKeyword: string
    unsaveKeyword: string
    saveVideo: string
    unsaveVideo: string
    saveChannel: string
    unsaveChannel: string
    export: string
  }
  auth: {
    login: string
    register: string
    logout: string
    email: string
    password: string
    fullName: string
    forgotPassword: string
    dontHaveAccount: string
    alreadyHaveAccount: string
    loginSuccess: string
    registerSuccess: string
    logoutSuccess: string
    emailNotConfirmed: string
    pleaseFillInfo: string
    passwordMinLength: string
    currentPasswordIncorrect: string
    somethingWrong: string
    registerNow: string
  }
  loginPage: {
    welcomeBack: string
    loginDescription: string
    enterPassword: string
    hidePassword: string
    showPassword: string
  }
  registerPage: {
    createAccount: string
    registerDescription: string
    enterFullName: string
    atLeast6Chars: string
  }
  forgotPassword: {
    title: string
    description: string
    sendResetLink: string
    emailSent: string
    checkYourEmail: string
    sentTo: string
    spamTip: string
    backToLogin: string
  }
  resetPassword: {
    title: string
    description: string
    newPassword: string
    confirmNewPassword: string
    passwordNotMatch: string
    resetPassword: string
    resetSuccess: string
    resetSuccessTitle: string
    resetSuccessDescription: string
    invalidLink: string
    invalidLinkDescription: string
    requestNewLink: string
  }
  verifyEmail: {
    title: string
    emailNotConfirmed: string
    subtitle: string
    instruction: string
    resendEmail: string
    resending: string
    logout: string
    tip: string
    tipText: string
    emailSent: string
    cannotResend: string
  }
  app: {
    appName: string
    appTagline: string
  }
  dashboard: {
    greeting: string
    subtitle: string
    apiQuota: string
    quotaUsed: string
    recentSearches: string
    savedKeywords: string
    savedVideos: string
    savedChannels: string
    quickActions: string
    analyzeKeyword: string
    searchVideos: string
    trending: string
    noSavedKeywords: string
    noSavedVideos: string
    noRecentSearches: string
    quotaRemaining: string
    searchesToday: string
  }
  keywordExplorer: {
    title: string
    subtitle: string
    enterKeyword: string
    analyze: string
    analyzing: string
    searchPlaceholder: string
    metrics: string
    competition: string
    avgViews: string
    avgLikes: string
    avgComments: string
    engagementRate: string
    resultCount: string
    topVideos: string
    competitionLevels: {
      low: string
      medium: string
      high: string
    }
    engagementLevels: {
      low: string
      medium: string
      high: string
    }
    quotaWarning: string
    noResults: string
    saveSuccess: string
    unsaveSuccess: string
    saved: string
  }
  keywordExtra: {
    opportunityScore: string
    opportunityHint: string
    scoreExcellent: string
    scoreGood: string
    scoreFair: string
    scorePoor: string
    viewsDistribution: string
    relatedKeywords: string
    relatedEmpty: string
    difficultyScore: string
    difficultyHint: string
    difficultyLevels: {
      low: string
      medium: string
      high: string
    }
    nicheScore: string
    nicheHint: string
    nicheExcellent: string
    nicheGood: string
    nicheFair: string
    nichePoor: string
    avgChannelSubs: string
    avgVideoAge: string
    viewsPerDay: string
    questionKeywords: string
    questionEmpty: string
  }
  trending: {
    title: string
    subtitle: string
    country: string
    category: string
    loadTrending: string
    noResults: string
  }
  videoAnalyzer: {
  title: string
  subtitle: string
  searchPlaceholder: string
  sortBy: string
  sortDate: string
  sortViews: string
  sortRating: string
  results: string
  noResults: string
  views: string
  likes: string
  comments: string
  duration: string
  publishedAt: string
  videoSaved: string
  videoUnsaved: string
  tags: string
  }
  channelAnalyzer: {
    title: string
    subtitle: string
    searchPlaceholder: string
    subscribers: string
    videoCount: string
    totalViews: string
    noResults: string
    channelSaved: string
    channelUnsaved: string
  }
  apiKey: {
    title: string
    subtitle: string
    description: string
    howToGet: string
    step1: string
    step2: string
    step3: string
    step4: string
    enterKey: string
    save: string
    delete: string
    saveSuccess: string
    deleteSuccess: string
    keyActive: string
    keyInactive: string
    quotaUsage: string
    quotaRemaining: string
    searchesToday: string
    freeQuota: string
    apiKeyPlaceholder: string
    getApiKey: string
  }
  settings: {
    settings: string
    language: string
    password: string
    apiKey: string
    changePassword: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
    enterCurrentPassword: string
    enterNewPassword: string
    enterConfirmPassword: string
    passwordNotMatch: string
    changePasswordSuccess: string
    processing: string
    editProfile: string
    fullName: string
    updateProfile: string
    profileUpdated: string
    enterFullName: string
    passwordChangeFailed: string
    avatarUpdated: string
    avatarTooLarge: string
    darkMode: string
    lightMode: string
    history: string
  }
  notifications: {
    title: string
  }
  theme: {
    theme: string
    default: string
    blue: string
    green: string
    orange: string
    rose: string
    violet: string
  }
  errors: {
    pageNotFound: string
    pageNotFoundDesc: string
    takeMeHome: string
    forbidden: string
    forbiddenDesc: string
    serverError: string
    serverErrorDesc: string
    reload: string
    errorBoundary: string
    errorBoundaryDesc: string
    oops: string
    somethingWentWrong: string
    errorDescription: string
    tryAgain: string
    reloadPage: string
    accessDenied: string
    accessDeniedDesc: string
    returnToDashboard: string
    internalServerError: string
    goToHome: string
  }
  savedItems: {
    title: string
    keywords: string
    videos: string
    channels: string
    empty: string
    score: string
  }
}

// ===== Vietnamese =====
export const translations: Record<Language, TranslationKey> = {
  vi: {
    nav: {
      home: 'Trang chủ',
      keywords: 'Từ khóa',
      trending: 'Xu hướng',
      videos: 'Video',
      profile: 'Khác',
    },
    common: {
      save: 'Lưu',
      cancel: 'Hủy',
      delete: 'Xóa',
      edit: 'Sửa',
      add: 'Thêm',
      confirm: 'Xác nhận',
      loading: 'Đang tải...',
      search: 'Tìm kiếm',
      noData: 'Không có dữ liệu',
      success: 'Thành công',
      error: 'Lỗi',
      retry: 'Thử lại',
      yes: 'Có',
      no: 'Không',
      select: 'Chọn...',
      all: 'Tất cả',
      total: 'Tổng',
      justNow: 'Vừa xong',
      minutesAgo: 'phút trước',
      hoursAgo: 'giờ trước',
      daysAgo: 'ngày trước',
      offlineMode: 'Đang ngoại tuyến',
      saveKeyword: 'Lưu từ khóa',
      unsaveKeyword: 'Bỏ lưu',
      saveVideo: 'Lưu video',
      unsaveVideo: 'Bỏ lưu',
      saveChannel: 'Lưu kênh',
      unsaveChannel: 'Bỏ lưu',
      export: 'Xuất file',
    },
    auth: {
      login: 'Đăng nhập',
      register: 'Đăng ký',
      logout: 'Đăng xuất',
      email: 'Email',
      password: 'Mật khẩu',
      fullName: 'Họ và tên',
      forgotPassword: 'Quên mật khẩu?',
      dontHaveAccount: 'Chưa có tài khoản?',
      alreadyHaveAccount: 'Đã có tài khoản?',
      loginSuccess: 'Đăng nhập thành công!',
      registerSuccess: 'Đăng ký thành công!',
      logoutSuccess: 'Đăng xuất thành công',
      emailNotConfirmed: 'Email chưa được xác nhận',
      pleaseFillInfo: 'Vui lòng điền đầy đủ thông tin',
      passwordMinLength: 'Mật khẩu phải có ít nhất 8 ký tự',
      currentPasswordIncorrect: 'Mật khẩu hiện tại không đúng',
      somethingWrong: 'Có lỗi xảy ra',
      registerNow: 'Đăng ký ngay',
    },
    loginPage: {
      welcomeBack: 'Chào mừng trở lại',
      loginDescription: 'Đăng nhập để tiếp tục nghiên cứu từ khóa YouTube',
      enterPassword: 'Nhập mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      showPassword: 'Hiện mật khẩu',
    },
    registerPage: {
      createAccount: 'Tạo tài khoản',
      registerDescription: 'Điền thông tin để đăng ký tài khoản mới',
      enterFullName: 'Nhập họ và tên',
      atLeast6Chars: 'Ít nhất 6 ký tự',
    },
    forgotPassword: {
      title: 'Quên mật khẩu',
      description: 'Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.',
      sendResetLink: 'Gửi link đặt lại mật khẩu',
      emailSent: 'Đã gửi email đặt lại mật khẩu',
      checkYourEmail: 'Kiểm tra email của bạn',
      sentTo: 'Chúng tôi đã gửi link đặt lại mật khẩu đến',
      spamTip: 'Nếu không thấy email, hãy kiểm tra hộp thư spam.',
      backToLogin: 'Quay lại đăng nhập',
    },
    resetPassword: {
      title: 'Đặt lại mật khẩu',
      description: 'Nhập mật khẩu mới cho tài khoản của bạn',
      newPassword: 'Mật khẩu mới',
      confirmNewPassword: 'Xác nhận mật khẩu mới',
      passwordNotMatch: 'Mật khẩu mới không khớp',
      resetPassword: 'Đặt lại mật khẩu',
      resetSuccess: 'Đặt lại mật khẩu thành công!',
      resetSuccessTitle: 'Mật khẩu đã được cập nhật',
      resetSuccessDescription: 'Bạn có thể đăng nhập bằng mật khẩu mới.',
      invalidLink: 'Link không hợp lệ',
      invalidLinkDescription: 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.',
      requestNewLink: 'Yêu cầu link mới',
    },
    verifyEmail: {
      title: 'Xác nhận Email',
      emailNotConfirmed: 'Email chưa được xác nhận',
      subtitle: 'Chúng tôi đã gửi một email xác nhận đến',
      instruction: 'Vui lòng click vào link trong email để xác nhận tài khoản trước khi sử dụng ứng dụng.',
      resendEmail: 'Gửi lại email xác nhận',
      resending: 'Đang gửi...',
      logout: 'Đăng xuất',
      tip: 'Mẹo',
      tipText: 'Nếu không thấy email, hãy kiểm tra hộp thư spam hoặc thử gửi lại sau vài phút.',
      emailSent: 'Đã gửi lại email xác nhận',
      cannotResend: 'Không thể gửi lại email. Vui lòng thử lại.',
    },
    app: {
      appName: 'Vibe Tube Atlas',
      appTagline: 'Nghiên cứu từ khóa YouTube',
    },
    dashboard: {
      greeting: 'Xin chào!',
      subtitle: 'Nghiên cứu từ khóa YouTube thông minh',
      apiQuota: 'API Quota',
      quotaUsed: 'Đã dùng',
      recentSearches: 'Tìm kiếm gần đây',
      savedKeywords: 'Từ khóa đã lưu',
      savedVideos: 'Video đã lưu',
      savedChannels: 'Kênh đã lưu',
      quickActions: 'Truy cập nhanh',
      analyzeKeyword: 'Phân tích từ khóa',
      searchVideos: 'Tìm video',
      trending: 'Xu hướng',
      noSavedKeywords: 'Chưa có từ khóa nào được lưu',
      noSavedVideos: 'Chưa có video nào được lưu',
      noRecentSearches: 'Chưa có lịch sử tìm kiếm',
      quotaRemaining: 'Còn lại',
      searchesToday: 'Lượt tìm hôm nay',
    },
    keywordExplorer: {
      title: 'Phân tích từ khóa',
      subtitle: 'Đánh giá mức độ cạnh tranh và tương tác',
      enterKeyword: 'Nhập từ khóa',
      analyze: 'Phân tích',
      analyzing: 'Đang phân tích...',
      searchPlaceholder: 'VD: cooking, gaming, beauty...',
      metrics: 'Chỉ số',
      competition: 'Cạnh tranh',
      avgViews: 'View trung bình',
      avgLikes: 'Like trung bình',
      avgComments: 'Comment trung bình',
      engagementRate: 'Tỷ lệ tương tác',
      resultCount: 'Số kết quả',
      topVideos: 'Top video',
      competitionLevels: { low: 'Thấp', medium: 'Trung bình', high: 'Cao' },
      engagementLevels: { low: 'Thấp', medium: 'Trung bình', high: 'Cao' },
      quotaWarning: 'Phân tích tốn ~120 quota units. Bạn còn đủ quota không?',
      noResults: 'Không tìm thấy video cho từ khóa này',
      saveSuccess: 'Đã lưu từ khóa',
      unsaveSuccess: 'Đã bỏ lưu từ khóa',
      saved: 'Đã lưu',
    },
    keywordExtra: {
      opportunityScore: 'Điểm cơ hội',
      opportunityHint: 'Dựa trên cạnh tranh, views và tương tác',
      scoreExcellent: 'Cơ hội tuyệt vời',
      scoreGood: 'Cơ hội tốt',
      scoreFair: 'Cơ hội khá',
      scorePoor: 'Khó cạnh tranh',
      viewsDistribution: 'Phân bố views',
      relatedKeywords: 'Từ khóa tương tự',
      relatedEmpty: 'Không có từ khóa gợi ý',
      difficultyScore: 'Độ khó',
      difficultyHint: 'Càng thấp càng dễ rank',
      difficultyLevels: { low: 'Dễ', medium: 'Trung bình', high: 'Khó' },
      nicheScore: 'Điểm ngách',
      nicheHint: 'Nhu cầu cao + ít cạnh tranh = ngách tốt',
      nicheExcellent: 'Ngách tuyệt vời',
      nicheGood: 'Ngách tốt',
      nicheFair: 'Ngách khá',
      nichePoor: 'Ngách khó',
      avgChannelSubs: 'Sub trung bình',
      avgVideoAge: 'Tuổi video TB',
      viewsPerDay: 'Views/ngày (top 1)',
      questionKeywords: 'Câu hỏi tìm kiếm',
      questionEmpty: 'Không có câu hỏi gợi ý',
    },
    trending: {
      title: 'Xu hướng',
      subtitle: 'Video đang thịnh hành theo quốc gia',
      country: 'Quốc gia',
      category: 'Danh mục',
      loadTrending: 'Xem xu hướng',
      noResults: 'Không có video xu hướng',
    },
    videoAnalyzer: {
      title: 'Tìm video',
      subtitle: 'Tìm kiếm video theo từ khóa',
      searchPlaceholder: 'Nhập từ khóa tìm kiếm...',
      sortBy: 'Sắp xếp',
      sortDate: 'Mới nhất',
      sortViews: 'View cao nhất',
      sortRating: 'Đánh giá cao',
      results: 'Kết quả',
      noResults: 'Không tìm thấy video',
      views: 'lượt xem',
      likes: 'lượt thích',
      comments: 'bình luận',
      duration: 'Thời lượng',
      publishedAt: 'Đăng lúc',
      videoSaved: 'Đã lưu video',
      videoUnsaved: 'Đã bỏ lưu video',
      tags: 'Thẻ',
    },
    channelAnalyzer: {
      title: 'Phân tích kênh',
      subtitle: 'Tìm kênh theo từ khóa',
      searchPlaceholder: 'Nhập từ khóa...',
      subscribers: 'subscribers',
      videoCount: 'videos',
      totalViews: 'total views',
      noResults: 'Không tìm thấy kênh',
      channelSaved: 'Đã lưu kênh',
      channelUnsaved: 'Đã bỏ lưu kênh',
    },
    apiKey: {
      title: 'API Key',
      subtitle: 'Quản lý YouTube Data API key',
      description: 'Mỗi user dùng API key riêng. Free 10,000 quota/ngày.',
      howToGet: 'Hướng dẫn lấy API key',
      step1: 'Truy cập Google Cloud Console',
      step2: 'Tạo project mới hoặc chọn project có sẵn',
      step3: 'Bật YouTube Data API v3',
      step4: 'Tạo API key trong Credentials',
      enterKey: 'Nhập API Key',
      save: 'Lưu API Key',
      delete: 'Xóa API Key',
      saveSuccess: 'Đã lưu API key',
      deleteSuccess: 'Đã xóa API key',
      keyActive: 'API Key đang hoạt động',
      keyInactive: 'Chưa có API Key',
      quotaUsage: 'Quota sử dụng',
      quotaRemaining: 'Quota còn lại',
      searchesToday: 'Lượt tìm hôm nay',
      freeQuota: 'Free 10,000 units/ngày',
      apiKeyPlaceholder: 'AIza...',
      getApiKey: 'Lấy API Key',
    },
    settings: {
      settings: 'Cài đặt',
      language: 'Ngôn ngữ',
      password: 'Đổi mật khẩu',
      apiKey: 'YouTube API Key',
      changePassword: 'Đổi mật khẩu',
      currentPassword: 'Mật khẩu hiện tại',
      newPassword: 'Mật khẩu mới',
      confirmPassword: 'Xác nhận mật khẩu',
      enterCurrentPassword: 'Nhập mật khẩu hiện tại',
      enterNewPassword: 'Nhập mật khẩu mới',
      enterConfirmPassword: 'Nhập lại mật khẩu mới',
      passwordNotMatch: 'Mật khẩu mới không khớp',
      changePasswordSuccess: 'Đổi mật khẩu thành công!',
      processing: 'Đang xử lý...',
      editProfile: 'Chỉnh sửa thông tin',
      fullName: 'Họ và tên',
      updateProfile: 'Cập nhật',
      profileUpdated: 'Cập nhật thông tin thành công',
      enterFullName: 'Nhập họ và tên',
      passwordChangeFailed: 'Đổi mật khẩu thất bại',
      avatarUpdated: 'Cập nhật ảnh đại diện thành công',
      avatarTooLarge: 'File quá lớn. Tối đa 2MB.',
      darkMode: 'Chế độ tối',
      lightMode: 'Chế độ sáng',
      history: 'Lịch sử tìm kiếm',
    },
    notifications: {
      title: 'Thông báo',
    },
    theme: {
      theme: 'Giao diện',
      default: 'Mặc định',
      blue: 'Xanh dương',
      green: 'Xanh lá',
      orange: 'Cam',
      rose: 'Hồng',
      violet: 'Tím',
    },
    errors: {
      pageNotFound: 'Không tìm thấy trang',
      pageNotFoundDesc: 'Trang bạn tìm không tồn tại hoặc đã được di chuyển.',
      takeMeHome: 'Về trang chủ',
      forbidden: 'Không có quyền truy cập',
      forbiddenDesc: 'Bạn không có quyền truy cập trang này.',
      serverError: 'Lỗi máy chủ',
      serverErrorDesc: 'Đã có lỗi xảy ra ở máy chủ. Vui lòng thử lại sau.',
      reload: 'Tải lại',
      errorBoundary: 'Ứng dụng gặp lỗi',
      errorBoundaryDesc: 'Đã có lỗi xảy ra. Vui lòng tải lại trang.',
      oops: 'Ối!',
      somethingWentWrong: 'Đã xảy ra lỗi',
      errorDescription: 'Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc tải lại trang.',
      tryAgain: 'Thử lại',
      reloadPage: 'Tải lại trang',
      accessDenied: 'Truy cập bị từ chối',
      accessDeniedDesc: 'Bạn không có quyền truy cập vào trang này.',
      returnToDashboard: 'Về trang chính',
      internalServerError: 'Lỗi máy chủ nội bộ',
      goToHome: 'Về trang chủ',
    },
    savedItems: {
      title: 'Đã lưu',
      keywords: 'Từ khóa',
      videos: 'Video',
      channels: 'Kênh',
      empty: 'Chưa có mục nào được lưu',
      score: 'Điểm',
    },
  },

  // ===== English =====
  en: {
    nav: {
      home: 'Home',
      keywords: 'Keywords',
      trending: 'Trending',
      videos: 'Videos',
      profile: 'More',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      confirm: 'Confirm',
      loading: 'Loading...',
      search: 'Search',
      noData: 'No data',
      success: 'Success',
      error: 'Error',
      retry: 'Retry',
      yes: 'Yes',
      no: 'No',
      select: 'Select...',
      all: 'All',
      total: 'Total',
      justNow: 'Just now',
      minutesAgo: 'min ago',
      hoursAgo: 'hr ago',
      daysAgo: 'days ago',
      offlineMode: 'Offline',
      saveKeyword: 'Save keyword',
      unsaveKeyword: 'Unsave',
      saveVideo: 'Save video',
      unsaveVideo: 'Unsave',
      saveChannel: 'Save channel',
      unsaveChannel: 'Unsave',
      export: 'Export',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      fullName: 'Full Name',
      forgotPassword: 'Forgot password?',
      dontHaveAccount: 'Don\'t have an account?',
      alreadyHaveAccount: 'Already have an account?',
      loginSuccess: 'Login successful!',
      registerSuccess: 'Registration successful!',
      logoutSuccess: 'Logged out',
      emailNotConfirmed: 'Email not confirmed',
      pleaseFillInfo: 'Please fill in all fields',
      passwordMinLength: 'Password must be at least 8 characters',
      currentPasswordIncorrect: 'Current password is incorrect',
      somethingWrong: 'Something went wrong',
      registerNow: 'Register now',
    },
    loginPage: {
      welcomeBack: 'Welcome back',
      loginDescription: 'Sign in to continue researching YouTube keywords',
      enterPassword: 'Enter password',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
    },
    registerPage: {
      createAccount: 'Create account',
      registerDescription: 'Fill in your details to create a new account',
      enterFullName: 'Enter your full name',
      atLeast6Chars: 'At least 6 characters',
    },
    forgotPassword: {
      title: 'Forgot Password',
      description: 'Enter your registered email and we\'ll send you a reset link.',
      sendResetLink: 'Send reset link',
      emailSent: 'Reset link sent',
      checkYourEmail: 'Check your email',
      sentTo: 'We\'ve sent a reset link to',
      spamTip: 'If you don\'t see the email, check your spam folder.',
      backToLogin: 'Back to login',
    },
    resetPassword: {
      title: 'Reset Password',
      description: 'Enter a new password for your account',
      newPassword: 'New password',
      confirmNewPassword: 'Confirm new password',
      passwordNotMatch: 'Passwords don\'t match',
      resetPassword: 'Reset password',
      resetSuccess: 'Password reset successfully!',
      resetSuccessTitle: 'Password updated',
      resetSuccessDescription: 'You can now log in with your new password.',
      invalidLink: 'Invalid link',
      invalidLinkDescription: 'This reset link has expired or is invalid. Please request a new one.',
      requestNewLink: 'Request new link',
    },
    verifyEmail: {
      title: 'Verify Email',
      emailNotConfirmed: 'Email not confirmed',
      subtitle: 'We\'ve sent a confirmation email to',
      instruction: 'Please click the link in the email to verify your account before using the app.',
      resendEmail: 'Resend verification email',
      resending: 'Sending...',
      logout: 'Logout',
      tip: 'Tip',
      tipText: 'If you don\'t see the email, check your spam folder or try resending after a few minutes.',
      emailSent: 'Verification email resent',
      cannotResend: 'Cannot resend email. Please try again.',
    },
    app: {
      appName: 'Vibe Tube Atlas',
      appTagline: 'YouTube Keyword Research',
    },
    dashboard: {
      greeting: 'Hello!',
      subtitle: 'Smart YouTube keyword research',
      apiQuota: 'API Quota',
      quotaUsed: 'Used',
      recentSearches: 'Recent searches',
      savedKeywords: 'Saved keywords',
      savedVideos: 'Saved videos',
      savedChannels: 'Saved channels',
      quickActions: 'Quick actions',
      analyzeKeyword: 'Analyze keyword',
      searchVideos: 'Search videos',
      trending: 'Trending',
      noSavedKeywords: 'No saved keywords yet',
      noSavedVideos: 'No saved videos yet',
      noRecentSearches: 'No search history yet',
      quotaRemaining: 'Remaining',
      searchesToday: 'Searches today',
    },
    keywordExplorer: {
      title: 'Keyword Explorer',
      subtitle: 'Assess competition and engagement',
      enterKeyword: 'Enter keyword',
      analyze: 'Analyze',
      analyzing: 'Analyzing...',
      searchPlaceholder: 'e.g., cooking, gaming, beauty...',
      metrics: 'Metrics',
      competition: 'Competition',
      avgViews: 'Avg views',
      avgLikes: 'Avg likes',
      avgComments: 'Avg comments',
      engagementRate: 'Engagement rate',
      resultCount: 'Result count',
      topVideos: 'Top videos',
      competitionLevels: { low: 'Low', medium: 'Medium', high: 'High' },
      engagementLevels: { low: 'Low', medium: 'Medium', high: 'High' },
      quotaWarning: 'Analysis costs ~120 quota units. Do you have enough quota?',
      noResults: 'No videos found for this keyword',
      saveSuccess: 'Keyword saved',
      unsaveSuccess: 'Keyword unsaved',
      saved: 'Saved',
    },
    keywordExtra: {
      opportunityScore: 'Opportunity Score',
      opportunityHint: 'Based on competition, views and engagement',
      scoreExcellent: 'Excellent opportunity',
      scoreGood: 'Good opportunity',
      scoreFair: 'Fair opportunity',
      scorePoor: 'Hard to compete',
      viewsDistribution: 'Views distribution',
      relatedKeywords: 'Related keywords',
      relatedEmpty: 'No related keywords found',
      difficultyScore: 'Difficulty',
      difficultyHint: 'Lower = easier to rank',
      difficultyLevels: { low: 'Easy', medium: 'Medium', high: 'Hard' },
      nicheScore: 'Niche Score',
      nicheHint: 'High demand + low competition = good niche',
      nicheExcellent: 'Excellent niche',
      nicheGood: 'Good niche',
      nicheFair: 'Fair niche',
      nichePoor: 'Tough niche',
      avgChannelSubs: 'Avg channel subs',
      avgVideoAge: 'Avg video age',
      viewsPerDay: 'Views/day (top 1)',
      questionKeywords: 'Search questions',
      questionEmpty: 'No question keywords found',
    },
    trending: {
      title: 'Trending',
      subtitle: 'Trending videos by country',
      country: 'Country',
      category: 'Category',
      loadTrending: 'Load trending',
      noResults: 'No trending videos',
    },
    videoAnalyzer: {
      title: 'Video Search',
      subtitle: 'Search videos by keyword',
      searchPlaceholder: 'Enter search keyword...',
      sortBy: 'Sort by',
      sortDate: 'Newest',
      sortViews: 'Most viewed',
      sortRating: 'Highest rated',
      results: 'Results',
      noResults: 'No videos found',
      views: 'views',
      likes: 'likes',
      comments: 'comments',
      duration: 'Duration',
      publishedAt: 'Published',
      videoSaved: 'Video saved',
      videoUnsaved: 'Video unsaved',
      tags: 'Tags',
    },
    channelAnalyzer: {
      title: 'Channel Search',
      subtitle: 'Find channels by keyword',
      searchPlaceholder: 'Enter keyword...',
      subscribers: 'subscribers',
      videoCount: 'videos',
      totalViews: 'total views',
      noResults: 'No channels found',
      channelSaved: 'Channel saved',
      channelUnsaved: 'Channel unsaved',
    },
    apiKey: {
      title: 'API Key',
      subtitle: 'Manage your YouTube Data API key',
      description: 'Each user uses their own API key. Free 10,000 quota/day.',
      howToGet: 'How to get an API key',
      step1: 'Go to Google Cloud Console',
      step2: 'Create a new project or select existing',
      step3: 'Enable YouTube Data API v3',
      step4: 'Create an API key in Credentials',
      enterKey: 'Enter API Key',
      save: 'Save API Key',
      delete: 'Delete API Key',
      saveSuccess: 'API key saved',
      deleteSuccess: 'API key deleted',
      keyActive: 'API Key is active',
      keyInactive: 'No API Key set',
      quotaUsage: 'Quota usage',
      quotaRemaining: 'Quota remaining',
      searchesToday: 'Searches today',
      freeQuota: 'Free 10,000 units/day',
      apiKeyPlaceholder: 'AIza...',
      getApiKey: 'Get API Key',
    },
    settings: {
      settings: 'Settings',
      language: 'Language',
      password: 'Change password',
      apiKey: 'YouTube API Key',
      changePassword: 'Change password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      enterCurrentPassword: 'Enter current password',
      enterNewPassword: 'Enter new password',
      enterConfirmPassword: 'Re-enter new password',
      passwordNotMatch: 'Passwords don\'t match',
      changePasswordSuccess: 'Password changed successfully!',
      processing: 'Processing...',
      editProfile: 'Edit profile',
      fullName: 'Full name',
      updateProfile: 'Update',
      profileUpdated: 'Profile updated successfully',
      enterFullName: 'Enter your full name',
      passwordChangeFailed: 'Password change failed',
      avatarUpdated: 'Avatar updated successfully',
      avatarTooLarge: 'File too large. Max 2MB.',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
      history: 'Search history',
    },
    notifications: {
      title: 'Notifications',
    },
    theme: {
      theme: 'Theme',
      default: 'Default',
      blue: 'Blue',
      green: 'Green',
      orange: 'Orange',
      rose: 'Rose',
      violet: 'Violet',
    },
    errors: {
      pageNotFound: 'Page not found',
      pageNotFoundDesc: 'The page you are looking for does not exist or has been moved.',
      takeMeHome: 'Take me home',
      forbidden: 'Access forbidden',
      forbiddenDesc: 'You do not have permission to access this page.',
      serverError: 'Server error',
      serverErrorDesc: 'Something went wrong on our end. Please try again later.',
      reload: 'Reload',
      errorBoundary: 'App encountered an error',
      errorBoundaryDesc: 'An error occurred. Please reload the page.',
      oops: 'Oops!',
      somethingWentWrong: 'Something went wrong',
      errorDescription: 'The app encountered an unexpected error. Please try again or reload the page.',
      tryAgain: 'Try again',
      reloadPage: 'Reload page',
      accessDenied: 'Access denied',
      accessDeniedDesc: 'You do not have permission to access this page.',
      returnToDashboard: 'Return to dashboard',
      internalServerError: 'Internal server error',
      goToHome: 'Go home',
    },
    savedItems: {
      title: 'Saved Items',
      keywords: 'Keywords',
      videos: 'Videos',
      channels: 'Channels',
      empty: 'No saved items yet',
      score: 'Score',
    },
  },
}
