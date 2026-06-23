import * as Icons from 'lucide-react';
import * as React from 'react';

type IconComponent = React.ComponentType<any>;

const fallbackIcon = Icons.Circle;

function makeIcon(Icon: IconComponent | undefined): IconComponent {
  const WrappedIcon = React.forwardRef<SVGSVGElement, any>(
    ({ style, className, spin, rotate, twoToneColor, ...props }, ref) => {
      const LucideIcon = Icon ?? fallbackIcon;
      return (
        <LucideIcon
          ref={ref}
          className={className}
          style={{
            width: '1em',
            height: '1em',
            verticalAlign: '-0.125em',
            animation: spin ? 'loading 1s linear infinite' : undefined,
            transform: rotate ? `rotate(${rotate}deg)` : undefined,
            ...style,
          }}
          aria-hidden="true"
          focusable="false"
          {...props}
        />
      );
    }
  );
  WrappedIcon.displayName = Icon?.displayName ?? 'Icon';
  return WrappedIcon;
}

export const AimOutlined = makeIcon(Icons.Crosshair);
export const AlertOutlined = makeIcon(Icons.TriangleAlert);
export const ApartmentOutlined = makeIcon(Icons.Building2);
export const ApiOutlined = makeIcon(Icons.Workflow);
export const AppstoreOutlined = makeIcon(Icons.LayoutGrid);
export const ArrowDownOutlined = makeIcon(Icons.ArrowDown);
export const ArrowLeftOutlined = makeIcon(Icons.ArrowLeft);
export const ArrowUpOutlined = makeIcon(Icons.ArrowUp);
export const AudioOutlined = makeIcon(Icons.Mic);
export const BankOutlined = makeIcon(Icons.Landmark);
export const BarChartOutlined = makeIcon(Icons.ChartColumn);
export const BellOutlined = makeIcon(Icons.Bell);
export const BgColorsOutlined = makeIcon(Icons.Palette);
export const BookOutlined = makeIcon(Icons.BookOpen);
export const BranchesOutlined = makeIcon(Icons.GitBranch);
export const BugOutlined = makeIcon(Icons.Bug);
export const BulbOutlined = makeIcon(Icons.Lightbulb);
export const CalculatorOutlined = makeIcon(Icons.Calculator);
export const CalendarOutlined = makeIcon(Icons.Calendar);
export const CaretDownOutlined = makeIcon(Icons.ChevronDown);
export const CaretUpOutlined = makeIcon(Icons.ChevronUp);
export const CheckCircleOutlined = makeIcon(Icons.CircleCheck);
export const CheckOutlined = makeIcon(Icons.Check);
export const CheckSquareOutlined = makeIcon(Icons.SquareCheck);
export const ClearOutlined = makeIcon(Icons.Eraser);
export const ClockCircleOutlined = makeIcon(Icons.Clock);
export const CloseCircleOutlined = makeIcon(Icons.CircleX);
export const CloseOutlined = makeIcon(Icons.X);
export const CloudDownloadOutlined = makeIcon(Icons.CloudDownload);
export const CloudServerOutlined = makeIcon(Icons.Cloud);
export const CodeOutlined = makeIcon(Icons.Code);
export const CommentOutlined = makeIcon(Icons.MessageCircle);
export const ContactsOutlined = makeIcon(Icons.Contact);
export const ContainerOutlined = makeIcon(Icons.Container);
export const ControlOutlined = makeIcon(Icons.SlidersHorizontal);
export const CopyOutlined = makeIcon(Icons.Copy);
export const CreditCardOutlined = makeIcon(Icons.CreditCard);
export const CrownOutlined = makeIcon(Icons.Crown);
export const CustomerServiceOutlined = makeIcon(Icons.Headphones);
export const DashboardOutlined = makeIcon(Icons.LayoutDashboard);
export const DatabaseOutlined = makeIcon(Icons.Database);
export const DeleteOutlined = makeIcon(Icons.Trash2);
export const DeploymentUnitOutlined = makeIcon(Icons.Network);
export const DesktopOutlined = makeIcon(Icons.Monitor);
export const DisconnectOutlined = makeIcon(Icons.Unplug);
export const DislikeOutlined = makeIcon(Icons.ThumbsDown);
export const DollarOutlined = makeIcon(Icons.DollarSign);
export const DownOutlined = makeIcon(Icons.ChevronDown);
export const DownloadOutlined = makeIcon(Icons.Download);
export const EditOutlined = makeIcon(Icons.Pencil);
export const EllipsisOutlined = makeIcon(Icons.Ellipsis);
export const EnvironmentOutlined = makeIcon(Icons.MapPin);
export const ExclamationCircleOutlined = makeIcon(Icons.CircleAlert);
export const ExperimentOutlined = makeIcon(Icons.FlaskConical);
export const ExportOutlined = makeIcon(Icons.FileUp);
export const EyeInvisibleOutlined = makeIcon(Icons.EyeOff);
export const EyeOutlined = makeIcon(Icons.Eye);
export const EyeTwoTone = makeIcon(Icons.Eye);
export const FacebookOutlined = makeIcon(Icons.Facebook);
export const FallOutlined = makeIcon(Icons.TrendingDown);
export const FileExcelOutlined = makeIcon(Icons.FileSpreadsheet);
export const FileImageOutlined = makeIcon(Icons.FileImage);
export const FileOutlined = makeIcon(Icons.File);
export const FilePdfOutlined = makeIcon(Icons.FileText);
export const FileSearchOutlined = makeIcon(Icons.FileSearch);
export const FileSyncOutlined = makeIcon(Icons.RefreshCw);
export const FileTextOutlined = makeIcon(Icons.FileText);
export const FilterOutlined = makeIcon(Icons.Filter);
export const FireOutlined = makeIcon(Icons.Flame);
export const FlagOutlined = makeIcon(Icons.Flag);
export const FontColorsOutlined = makeIcon(Icons.Type);
export const FormOutlined = makeIcon(Icons.SquarePen);
export const FrownOutlined = makeIcon(Icons.Frown);
export const FundOutlined = makeIcon(Icons.ChartNoAxesColumnIncreasing);
export const GlobalOutlined = makeIcon(Icons.Globe);
export const GoogleOutlined = makeIcon(Icons.Chrome);
export const HeartOutlined = makeIcon(Icons.Heart);
export const HighlightOutlined = makeIcon(Icons.Highlighter);
export const HistoryOutlined = makeIcon(Icons.History);
export const HomeOutlined = makeIcon(Icons.House);
export const InboxOutlined = makeIcon(Icons.Inbox);
export const InfoCircleOutlined = makeIcon(Icons.CircleHelp);
export const InstagramOutlined = makeIcon(Icons.Instagram);
export const InteractionOutlined = makeIcon(Icons.MousePointerClick);
export const KeyOutlined = makeIcon(Icons.KeyRound);
export const LeftOutlined = makeIcon(Icons.ChevronLeft);
export const LikeOutlined = makeIcon(Icons.ThumbsUp);
export const LineChartOutlined = makeIcon(Icons.ChartLine);
export const LinkOutlined = makeIcon(Icons.Link);
export const LinkedinOutlined = makeIcon(Icons.Linkedin);
export const LoadingOutlined = makeIcon(Icons.LoaderCircle);
export const LockOutlined = makeIcon(Icons.Lock);
export const LogoutOutlined = makeIcon(Icons.LogOut);
export const MailOutlined = makeIcon(Icons.Mail);
export const MehOutlined = makeIcon(Icons.Meh);
export const MenuOutlined = makeIcon(Icons.Menu);
export const MergeOutlined = makeIcon(Icons.GitMerge);
export const MessageOutlined = makeIcon(Icons.MessageSquare);
export const MinusCircleOutlined = makeIcon(Icons.CircleMinus);
export const MinusOutlined = makeIcon(Icons.Minus);
export const MobileOutlined = makeIcon(Icons.Smartphone);
export const MoreOutlined = makeIcon(Icons.Ellipsis);
export const NodeIndexOutlined = makeIcon(Icons.Network);
export const NotificationOutlined = makeIcon(Icons.Megaphone);
export const PaperClipOutlined = makeIcon(Icons.Paperclip);
export const PauseCircleOutlined = makeIcon(Icons.CirclePause);
export const PayCircleOutlined = makeIcon(Icons.CircleDollarSign);
export const PercentageOutlined = makeIcon(Icons.Percent);
export const PhoneOutlined = makeIcon(Icons.Phone);
export const PictureOutlined = makeIcon(Icons.Image);
export const PieChartOutlined = makeIcon(Icons.ChartPie);
export const PlayCircleOutlined = makeIcon(Icons.CirclePlay);
export const PlusOutlined = makeIcon(Icons.Plus);
export const PushpinOutlined = makeIcon(Icons.Pin);
export const QrcodeOutlined = makeIcon(Icons.QrCode);
export const QuestionCircleOutlined = makeIcon(Icons.CircleQuestionMark);
export const QuestionOutlined = makeIcon(Icons.CircleQuestionMark);
export const ReconciliationOutlined = makeIcon(Icons.ClipboardCheck);
export const RedoOutlined = makeIcon(Icons.Redo2);
export const ReloadOutlined = makeIcon(Icons.RefreshCw);
export const RetweetOutlined = makeIcon(Icons.Repeat2);
export const RightOutlined = makeIcon(Icons.ChevronRight);
export const RiseOutlined = makeIcon(Icons.TrendingUp);
export const RobotOutlined = makeIcon(Icons.Bot);
export const RocketOutlined = makeIcon(Icons.Rocket);
export const RollbackOutlined = makeIcon(Icons.Undo2);
export const SafetyCertificateOutlined = makeIcon(Icons.ShieldCheck);
export const SafetyOutlined = makeIcon(Icons.Shield);
export const SaveOutlined = makeIcon(Icons.Save);
export const ScanOutlined = makeIcon(Icons.ScanLine);
export const ScheduleOutlined = makeIcon(Icons.CalendarClock);
export const SearchOutlined = makeIcon(Icons.Search);
export const SecurityScanOutlined = makeIcon(Icons.ScanSearch);
export const SendOutlined = makeIcon(Icons.Send);
export const SettingOutlined = makeIcon(Icons.Settings);
export const ShareAltOutlined = makeIcon(Icons.Share2);
export const ShieldOutlined = makeIcon(Icons.Shield);
export const ShopOutlined = makeIcon(Icons.Store);
export const ShoppingCartOutlined = makeIcon(Icons.ShoppingCart);
export const ShoppingOutlined = makeIcon(Icons.ShoppingBag);
export const SignatureOutlined = makeIcon(Icons.Signature);
export const SmileOutlined = makeIcon(Icons.Smile);
export const SortAscendingOutlined = makeIcon(Icons.ArrowUpAZ);
export const SortDescendingOutlined = makeIcon(Icons.ArrowDownZA);
export const StarFilled = makeIcon(Icons.Star);
export const StarOutlined = makeIcon(Icons.Star);
export const StopOutlined = makeIcon(Icons.Square);
export const SwapOutlined = makeIcon(Icons.ArrowLeftRight);
export const SyncOutlined = makeIcon(Icons.RefreshCw);
export const TableOutlined = makeIcon(Icons.Table);
export const TagOutlined = makeIcon(Icons.Tag);
export const TagsOutlined = makeIcon(Icons.Tags);
export const TeamOutlined = makeIcon(Icons.Users);
export const ThunderboltOutlined = makeIcon(Icons.Zap);
export const ToolOutlined = makeIcon(Icons.Wrench);
export const TrophyOutlined = makeIcon(Icons.Trophy);
export const TwitterOutlined = makeIcon(Icons.Twitter);
export const UndoOutlined = makeIcon(Icons.Undo2);
export const UnlockOutlined = makeIcon(Icons.LockOpen);
export const UnorderedListOutlined = makeIcon(Icons.List);
export const UploadOutlined = makeIcon(Icons.Upload);
export const UserAddOutlined = makeIcon(Icons.UserPlus);
export const UserOutlined = makeIcon(Icons.User);
export const UsergroupAddOutlined = makeIcon(Icons.UserRoundPlus);
export const VideoCameraOutlined = makeIcon(Icons.Video);
export const WalletOutlined = makeIcon(Icons.Wallet);
export const WarningOutlined = makeIcon(Icons.TriangleAlert);
export const WhatsAppOutlined = makeIcon(Icons.MessageCircle);
export const ZoomInOutlined = makeIcon(Icons.ZoomIn);
export const ZoomOutOutlined = makeIcon(Icons.ZoomOut);
