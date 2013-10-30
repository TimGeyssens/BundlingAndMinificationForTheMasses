<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="ProviderInstaller.ascx.cs" Inherits="Optimus.Umbraco.Dialogs.ProviderInstaller" %>
<%@ Register tagprefix="umb" assembly="controls" namespace="umbraco.uicontrols" %>

<style type="text/css">
	.provider-list { margin: 5px 0; }
	.provider-list td { font-weight: bold; font-size: 14px; }
	.provider-list td input { vertical-align: middle; margin-right: 10px; }
</style>

<div style="padding: 10px 10px 0;">
    
    <umb:feedback ID="Feedback1" runat="server" type="success" text="Optimus core successfully installed!" />
    <img src="/App_Plugins/Optimus/Content/Images/OptimusLogo.png" alt="Optimus" width="150"/>
  

    <%= @"</div></div></div><div class='propertypane' style=''><div><div style='padding: 0 10px 0;'>" %>
    <h1 style="margin-top: 10px;">Install Providers</h1>
    <umb:feedback id="feedback" runat="server" />
    <asp:panel id="pnlInstall" runat="server">
        <p>Now that you have the <strong>Optimus core</strong> installed, you can also install one or more additional providers.</p>
    	<p>Below is a list of providers to get you started.</p>
    	<p>To install these providers, simply mark the ones you would like to install, and click the "Install Selected Providers" button.</p>
        <asp:CheckBoxList id="chkProviders" runat="server" CssClass="provider-list"></asp:CheckBoxList>
        <p>
            <asp:button id="btnInstall" runat="server" Text="Install Selected Providers" onclick="btnInstall_Click" onclientclick="jQuery(this).hide(); jQuery('#installingMessage').show(); return true;" />
            <div style="display: none;" id="installingMessage">
                <umb:ProgressBar ID="ProgressBar1" runat="server" />
                <br />
                <em>&nbsp; &nbsp;Installing provider(s), please wait...</em><br />
            </div>
        </p>
    </asp:panel> 