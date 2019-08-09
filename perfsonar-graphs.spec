%define install_base /usr/lib/perfsonar/graphs
%define config_base %{install_base}/etc

# cron/apache entries are located in the 'etc' directory
%define apacheconf apache-perfsonar-graphs.conf

%define perfsonar_auto_version 4.2.0
%define perfsonar_auto_relnum 0.5.b2

Name:			perfsonar-graphs
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR Graphs
License:		ASL 2.0
Group:			Development/Libraries
URL:			http://www.perfsonar.net
Source0:		perfsonar-graphs-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:		noarch
BuildRequires: nodejs
Requires:		perl
Requires:		perl(AnyEvent) >= 4.81
Requires:		perl(AnyEvent::HTTP)
Requires:		perl(CGI)
Requires:		perl(Data::Validate::IP)
Requires:		perl(Data::UUID)
Requires:		perl(Exporter)
Requires:		perl(Getopt::Long)
Requires:		perl(HTML::Template)
Requires:		perl(IO::File)
Requires:		perl(JSON)
Requires:		perl(JSON::XS)
Requires:		perl(Log::Log4perl)
Requires:		perl(LWP::UserAgent)
Requires:		perl(Mouse)
Requires:		perl(NetAddr::IP)
Requires:		perl(Net::DNS)
Requires:		perl(Params::Validate)
Requires:		perl(Regexp::Common)
Requires:		perl(Socket)
Requires:		perl(Statistics::Descriptive)
Requires:		perl(Template)
Requires:		perl(Time::HiRes)
Requires:		perl(Time::Local)
Requires:       perl(Try::Tiny)
Requires:		perl(XML::LibXML) >= 1.60
Requires:		perl(YAML::Syck)
Requires:		httpd
Requires:		libperfsonar-perl
Requires:		libperfsonar-esmond-perl
Requires:		libperfsonar-sls-perl
Requires:		perfsonar-traceroute-viewer
Obsoletes:		perl-perfSONAR_PS-serviceTest
Obsoletes:		perl-perfSONAR-graphs
Provides:		perl-perfSONAR-graphs

%description
The perfSONAR Graphs package is a series of simple web-based GUIs that
interact with the perfSONAR services to locate and display datasets.

%pre
/usr/sbin/groupadd -r perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-graphs-%{version}.%{perfsonar_auto_relnum}

%build

%install
rm -rf %{buildroot}

make ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install

mkdir -p %{buildroot}/etc/httpd/conf.d

install -D -m 0644 etc/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}
rm -f %{buildroot}/%{install_base}/etc/{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
chown -R apache:apache %{install_base}/etc

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config %{install_base}/etc/*
%{install_base}/cgi-bin/*
%{install_base}/html/*
%{install_base}/lib/perfSONAR_PS/*
/etc/httpd/conf.d/*

%changelog
* Wed Jun 14 2017 mj82@grnoc.iu.edu 4.0.0.1-1
- Removed old graph CGIs and templates

* Thu Apr 19 2017 andy@es.net 4.0.0.1
- Fixed issue where esmond caused combine http and https in graphs

* Thu Sep 8 2016 mj82@globalnoc.iu.edu 4.0-rc1
- Update file layout prior to 4.0 RC1

* Thu Jun 19 2014 andy@es.net 3.4-1
- Added support for new MA

* Fri Jan 11 2013 asides@es.net 3.3-1
- 3.3 beta release

* Thu May 23 2011 sowmya@es.net 3.1-1
- Initial release as an RPM
