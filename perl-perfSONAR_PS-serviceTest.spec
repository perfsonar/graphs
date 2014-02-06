%define install_base /opt/perfsonar_ps/serviceTest

# cron/apache entries are located in the 'etc' directory
%define apacheconf apache-serviceTest.conf

%define relnum  4 
%define disttag pSPS

Name:			perl-perfSONAR_PS-serviceTest
Version:		3.3.2
Release:		%{relnum}.%{disttag}
Summary:		perfSONAR_PS serviceTest
License:		Distributable, see LICENSE
Group:			Development/Libraries
URL:			http://search.cpan.org/dist/perfSONAR_PS-serviceTest/
Source0:		perfSONAR_PS-serviceTest-%{version}.%{relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:		noarch
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
Requires:		perl(LWP::UserAgent)
Requires:		perl(Log::Log4perl)
Requires:		perl(NetAddr::IP)
Requires:		perl(Net::DNS)
Requires:		perl(Params::Validate)
Requires:		perl(Regexp::Common)
Requires:		perl(Socket)
Requires:		perl(Statistics::Descriptive)
Requires:		perl(Template)
Requires:		perl(Time::HiRes)
Requires:		perl(Time::Local)
Requires:		perl(XML::LibXML) >= 1.60
Requires:		perl(YAML::Syck)
Requires:		httpd

%description
The perfSONAR-PS serviceTest package is a series of simple web-based GUIs that
interact with the perfSONAR Information Services (IS) to locate and display
remote datasets.

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfSONAR_PS-serviceTest-%{version}.%{relnum}

%build

%install
rm -rf %{buildroot}

make ROOTPATH=%{buildroot}/%{install_base} rpminstall

#mkdir -p %{buildroot}/etc/cron.d

#awk "{gsub(/^PREFIX=.*/,\"PREFIX=%{install_base}\"); print}" scripts/%{crontab} > scripts/%{crontab}.new
#install -D -m 0600 scripts/%{crontab}.new %{buildroot}/etc/cron.d/%{crontab}

mkdir -p %{buildroot}/etc/httpd/conf.d

awk "{gsub(/^PREFIX=.*/,\"PREFIX=%{install_base}\"); print}" etc/%{apacheconf} > etc/%{apacheconf}.new
install -D -m 0644 etc/%{apacheconf}.new %{buildroot}/etc/httpd/conf.d/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar /opt/perfsonar_ps/serviceTest
chown -R apache:apache /opt/perfsonar_ps/serviceTest/etc

/etc/init.d/httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%config %{install_base}/etc/*
%{install_base}/cgi-bin/*
%{install_base}/doc/*
%{install_base}/lib/*
%{install_base}/JS/*
%{install_base}/templates/bw_error.tmpl
%{install_base}/templates/bw_graphing.tmpl
%{install_base}/templates/bw_pageDisplay.tmpl
%{install_base}/templates/delay_error.tmpl
%{install_base}/templates/delay_graphing.tmpl
%{install_base}/templates/delay_pageDisplay.tmpl
%{install_base}/templates/serviceTest_error.tmpl
%{install_base}/templates/serviceTest.tmpl
%config %{install_base}/templates/header.tmpl
%config %{install_base}/templates/footer.tmpl
%config %{install_base}/templates/sidebar.html

%{install_base}/images/*
%{install_base}/css/*
%{install_base}/html/*
/etc/httpd/conf.d/*

%changelog
* Fri Jan 11 2013 asides@es.net 3.3-1
- 3.3 beta release

* Thu May 23 2011 sowmya@es.net 3.1-1
- Initial release as an RPM
