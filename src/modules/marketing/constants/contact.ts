import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";

/**
 * Contact routes and socials, shared by the About page's "Get in Touch" block
 * and the dedicated Contact page so the two can never drift apart.
 */

export const CONTACT_CHANNELS = [
  {
    Icon: MailOutlineIcon,
    kicker: "Editorial Enquiries",
    email: "editorial@kiribe.com",
    desc: "Story pitches, corrections, and editorial feedback.",
  },
  {
    Icon: CampaignOutlinedIcon,
    kicker: "Press & Media",
    email: "press@kiribe.com",
    desc: "Media accreditation, partnership requests, and interviews.",
  },
  {
    Icon: HandshakeOutlinedIcon,
    kicker: "Advertising",
    email: "partnerships@kiribe.com",
    desc: "Sponsorship, native content, and brand partnerships.",
  },
] as const;

export const SOCIAL_LINKS = [
  { Icon: TwitterIcon, label: "Twitter", href: "#" },
  { Icon: InstagramIcon, label: "Instagram", href: "#" },
  { Icon: YouTubeIcon, label: "YouTube", href: "#" },
] as const;
