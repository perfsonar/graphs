%define _unpackaged_files_terminate_build      0
%define install_base /opt/perfsonar_ps/serviceTest

# cron/apache entry are located in the 'etc' directory
%define apacheconf apache-serviceTest.conf

%define relnum 3
%define disttag pSPS

Name:           perl-perfSONAR_PS-serviceTest
Version:        3.2.1
Release:        %{relnum}.%{disttag}
Summary:        perfSONAR_PS serviceTest
License:        distributable, see LICENSE
Group:          Development/Libraries
URL:            http://search.cpan.org/dist/perfSONAR_PS-serviceTest
Source0:        perfSONAR_PS-serviceTest-%{version}.%{relnum}.tar.gz
BuildRoot:      %{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:      noarch
Requires:		perl(AnyEvent) >= 4.81
Requires:		perl(AnyEvent::HTTP)
Requires:		perl(CGI)
Requires:		perl(Data::Validate::IP)
Requires:		perl(Exporter)
Requires:		perl(Getopt::Long)
Requires:		perl(HTML::Template)
Requires:		perl(IO::File)
Requires:               perl(JSON)
Requires:               perl(LWP::UserAgent)
Requires:		perl(Params::Validate)
Requires:               perl(Socket)
Requires:		perl(Time::HiRes)
Requires:		perl(Time::Local)
Requires:		perl(XML::LibXML) >= 1.60
#Requires:       perl(:MODULE_COMPAT_%(eval "`%{__perl} -V:version`"; echo $version))
Requires:       perl
Requires:       httpd
%description
The perfSONAR-PS serviceTest package is a series of simple web-based GUIs that interact with the perfSONAR Information Services (IS) to locate and display remote datasets.

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfSONAR_PS-serviceTest-%{version}.%{relnum}

%build

%install
rm -rf $RPM_BUILD_ROOT

make ROOTPATH=$RPM_BUILD_ROOT/%{install_base} rpminstall

#mkdir -p $RPM_BUILD_ROOT/etc/cron.d

#awk "{gsub(/^PREFIX=.*/,\"PREFIX=%{install_base}\"); print}" scripts/%{crontab} > scripts/%{crontab}.new
#install -D -m 600 scripts/%{crontab}.new $RPM_BUILD_ROOT/etc/cron.d/%{crontab}

mkdir -p $RPM_BUILD_ROOT/etc/httpd/conf.d

awk "{gsub(/^PREFIX=.*/,\"PREFIX=%{install_base}\"); print}" etc/%{apacheconf} > etc/%{apacheconf}.new
install -D -m 644 etc/%{apacheconf}.new $RPM_BUILD_ROOT/etc/httpd/conf.d/%{apacheconf}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar /opt/perfsonar_ps/serviceTest
chown -R apache:apache /opt/perfsonar_ps/serviceTest/etc

/etc/init.d/httpd restart

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,perfsonar,perfsonar,-)
%config %{install_base}/etc/*
%{install_base}/cgi-bin/*
%{install_base}/doc/*
%{install_base}/lib/*
%{install_base}/JS/*
%{install_base}/templates/bw_graphing.tmpl
%{install_base}/templates/bw_pageDisplay.tmpl
%{install_base}/templates/error.tmpl
%{install_base}/templates/graphing.tmpl
%{install_base}/templates/pageDisplay.tmpl
%{install_base}/templates/serviceTest_error.tmpl
%{install_base}/templates/serviceTest.tmpl
%config %{install_base}/templates/header.tmpl
%config %{install_base}/templates/footer.tmpl
%config %{install_base}/templates/sidebar.html

%{install_base}/images/*
%{install_base}/css/*
/etc/httpd/conf.d/*

%changelog
* Thu May 23 2011 sowmya@es.net 3.1-1
- Initial release as an RPM


